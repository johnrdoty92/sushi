package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/coder/websocket"
	"github.com/johnrdoty92/sushi/server/internal/rooms"
)

type GameServer struct {
	logf        func(f string, v ...any)
	Mux         http.ServeMux
	RoomManager rooms.RoomManager
}

type ClaimItemPayload struct {
	PlayerId string `json:"playerId"`
	ItemId   string `json:"itemId"`
}

func (gs *GameServer) handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	slug, err := gs.RoomManager.Create()
	if err != nil {
		gs.logf("Error creating room: %v", err)
		http.Error(w, "Failed to create room. Please try again.", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, slug)
}

func (gs *GameServer) handleStartRoom(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	room, err := gs.RoomManager.Get(slug)
	if err != nil {
		http.Error(w, "Failed to find room "+slug, http.StatusNotFound)
		return
	}

	if err := room.Start(); err != nil {
		if errors.Is(err, rooms.ErrGameAlreadyStarted) {
			http.Error(w, "Game already started", http.StatusBadRequest)
			return
		}
		gs.logf("Error starting game in room %s: %v", slug, err)
		http.Error(w, "Failed to start game. Please try again.", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (gs *GameServer) handleResetRoom(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	room, err := gs.RoomManager.Get(slug)
	if err != nil {
		http.Error(w, "Failed to find room "+slug, http.StatusNotFound)
		return
	}

	if err := room.Reset(); err != nil {
		if errors.Is(err, rooms.ErrGameAlreadyReset) || errors.Is(err, rooms.ErrGameAlreadyStarted) {
			http.Error(w, "Game cannot be reset", http.StatusBadRequest)
			return
		}
		gs.logf("Error resetting game in room %s: %v", slug, err)
		http.Error(w, "Failed to reset game. Please try again.", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (gs *GameServer) handleClaimItem(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	room, err := gs.RoomManager.Get(slug)
	if err != nil {
		http.Error(w, "Failed to find room "+slug, http.StatusNotFound)
		return
	}

	var payload ClaimItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid claim", http.StatusBadRequest)
		return
	}

	if err := room.ClaimItem(payload.PlayerId, payload.ItemId); err != nil {
		switch {
		case errors.Is(err, rooms.ErrPlayerNotFound), errors.Is(err, rooms.ErrItemNotFound):
			http.Error(w, "Player or item not found", http.StatusNotFound)
		case errors.Is(err, rooms.ErrItemAlreadyClaimed):
			http.Error(w, "Item already claimed", http.StatusConflict)
		case errors.Is(err, rooms.ErrGameNotStarted), errors.Is(err, rooms.ErrItemNotVisible):
			http.Error(w, "Cannot claim item", http.StatusBadRequest)
		default:
			gs.logf("Error claiming item %s for player %s in room %s: %v", payload.ItemId, payload.PlayerId, slug, err)
			http.Error(w, "Failed to claim item. Please try again.", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (gs *GameServer) handleUpdatePlayer(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	room, err := gs.RoomManager.Get(slug)
	if err != nil {
		http.Error(w, "Failed to find room "+slug, http.StatusNotFound)
		return
	}

	var player rooms.SubscriberState
	if err := json.NewDecoder(r.Body).Decode(&player); err != nil {
		http.Error(w, "Invalid player", http.StatusBadRequest)
		return
	}

	if err := room.UpdatePlayerPosition(player.Id, player.Position.X, player.Position.Y); err != nil {
		if errors.Is(err, rooms.ErrPlayerNotFound) {
			http.Error(w, "Player not found", http.StatusNotFound)
			return
		}
		gs.logf("Error updating player %s in room %s: %v", player.Id, slug, err)
		http.Error(w, "Failed to update player. Please try again.", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (gs *GameServer) handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Must provide name", http.StatusBadRequest)
		return
	}

	slug := r.PathValue("slug")
	room, err := gs.RoomManager.Get(slug)
	if err != nil {
		http.Error(w, "Failed to find room "+slug, http.StatusNotFound)
		return
	}

	var mu sync.Mutex
	var conn *websocket.Conn
	var closed bool

	sub := room.AddSubscriber(name, func() {
		mu.Lock()
		defer mu.Unlock()
		closed = true
		if conn != nil {
			conn.Close(websocket.StatusPolicyViolation, "connection too slow to keep up with messages")
		}
	})
	defer room.RemoveSubscriber(sub)

	tempConn, err := websocket.Accept(w, r, nil) // TODO: need to supply options
	if err != nil {
		gs.logf("error accepting websocket connection: %v", err)
		http.Error(w, "Failed to join room. Please try again", http.StatusInternalServerError)
		return
	}

	mu.Lock()
	if closed {
		mu.Unlock()
		gs.logf("connection closed early")
		http.Error(w, "Connection lost", http.StatusBadRequest)
	}

	conn = tempConn
	mu.Unlock()
	defer conn.CloseNow()

	ctx := conn.CloseRead(context.Background())

	idPayload, err := sub.GetIdPayload()
	if err != nil {
		gs.logf("failed to get player id: %v", err)
		http.Error(w, "Failed to create user. Please try again.", http.StatusInternalServerError)
		return
	}
	conn.Write(ctx, websocket.MessageText, idPayload)

	for {
		select {
		case message := <-sub.Messages:
			// TODO: add timeout for write
			conn.Write(ctx, websocket.MessageText, message)
		case <-ctx.Done():
			gs.logf("context cancelled: %v", ctx.Err())
			http.Error(w, "Connection closed.", http.StatusInternalServerError)
			return
		}
	}
}

func NewGameServer() *GameServer {
	gs := &GameServer{
		logf:        log.Printf,
		RoomManager: *rooms.NewRoomManager(),
	}
	gs.Mux.HandleFunc("POST /rooms", gs.handleCreateRoom)
	gs.Mux.HandleFunc("POST /rooms/{slug}/start", gs.handleStartRoom)
	gs.Mux.HandleFunc("POST /rooms/{slug}/reset", gs.handleResetRoom)
	gs.Mux.HandleFunc("PATCH /rooms/{slug}/items", gs.handleClaimItem)
	gs.Mux.HandleFunc("POST /rooms/{slug}/players", gs.handleUpdatePlayer)
	gs.Mux.HandleFunc("GET /rooms/{slug}", gs.handleJoinRoom)
	return gs
}

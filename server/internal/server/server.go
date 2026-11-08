package server

import (
	"context"
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

	// TODO: https://github.com/coder/websocket/blob/4237924393c4cde6eef7bd02c26c285db8179142/internal/examples/chat/chat.go#L114

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
	gs.Mux.HandleFunc("GET /rooms/{slug}", gs.handleJoinRoom)
	return gs
}

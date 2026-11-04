package server

import (
	"fmt"
	"log"
	"net/http"

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

func NewGameServer() *GameServer {
	gs := &GameServer{
		logf:        log.Printf,
		RoomManager: *rooms.NewRoomManager(),
	}
	gs.Mux.HandleFunc("POST /rooms", gs.handleCreateRoom)
	return gs
}

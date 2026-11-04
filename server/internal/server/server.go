package server

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/sio/coolname"
)

const maxSlugAttempts = 10

type room struct {
	// subscribers
	// items
	// add fn receiver to start/stop ticker
	// add fn receiver to marshal payload
}

type GameServer struct {
	logf                func(f string, v ...any)
	Mux                 http.ServeMux
	mu                  sync.Mutex
	rooms               map[string]room
	messageLengthBuffer int
}

func NewGameServer() *GameServer {
	gs := &GameServer{
		logf:                log.Printf,
		rooms:               make(map[string]room),
		messageLengthBuffer: 16,
	}
	gs.Mux.HandleFunc("POST /rooms", func(w http.ResponseWriter, r *http.Request) {
		slug, err := gs.createRoom()
		if err != nil {
			gs.logf("Error creating room: %v", err)
			http.Error(w, "Failed to create room. Please try again.", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		fmt.Fprint(w, slug)
	})
	return gs
}

func (gs *GameServer) createRoom() (string, error) {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	for range maxSlugAttempts {
		slug, err := coolname.SlugN(2)
		if err != nil {
			return "", fmt.Errorf("generating slug: %w", err)
		}
		if _, isTaken := gs.rooms[slug]; isTaken {
			continue
		}
		// TODO: init ticker
		gs.rooms[slug] = room{}
		return slug, nil
	}
	return "", fmt.Errorf("No unique slug after %d attempts", maxSlugAttempts)
}

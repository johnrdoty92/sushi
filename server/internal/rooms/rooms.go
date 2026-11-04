package rooms

import (
	"fmt"
	"sync"

	"github.com/sio/coolname"
)

const maxSlugAttempts = 10

type subscriber struct{}

type items struct{}

type room struct {
	subscribers map[*subscriber]struct{}
	items       map[*items]struct{}
	// add fn receiver to start/stop ticker
	// add fn receiver to marshal payload
}

type RoomManager struct {
	mu    sync.Mutex
	rooms map[string]room
}

func (rm *RoomManager) Create() (slug string, err error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	for range maxSlugAttempts {
		slug, err := coolname.SlugN(2)
		if err != nil {
			return "", fmt.Errorf("Error generating slug: %w", err)
		}
		if _, isTaken := rm.rooms[slug]; isTaken {
			continue
		}
		// TODO: init ticker
		rm.rooms[slug] = room{}
		return slug, nil
	}
	return "", fmt.Errorf("No unique slug after %d attempts", maxSlugAttempts)
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		mu:    sync.Mutex{},
		rooms: map[string]room{},
	}
}

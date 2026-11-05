package rooms

import (
	"fmt"
	"sync"

	"github.com/sio/coolname"
)

const maxSlugAttempts = 10
const defaultMessageBuffer = 16

type Subscriber struct {
	Name      string
	Messages  chan []byte
	CloseSlow func()
}

type items struct{}

type Room struct {
	mu          sync.Mutex
	subscribers map[*Subscriber]struct{}
	items       map[*items]struct{}
	buffer      int
}

func NewRoom() *Room {
	return &Room{
		subscribers: make(map[*Subscriber]struct{}),
		items:       make(map[*items]struct{}),
		buffer:      defaultMessageBuffer,
	}
}

func (r *Room) AddSubscriber(name string) *Subscriber {
	sub := &Subscriber{
		Name:      name,
		Messages:  make(chan []byte, r.buffer),
		CloseSlow: func() {},
	}
	r.mu.Lock()
	r.subscribers[sub] = struct{}{}
	r.mu.Unlock()
	return sub
}

func (r *Room) Publish(message []byte) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for s := range r.subscribers {
		select {
		case s.Messages <- message:
		default:
			s.CloseSlow()
		}
	}
}

type RoomManager struct {
	mu    sync.Mutex
	rooms map[string]*Room
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*Room),
	}
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
		rm.rooms[slug] = NewRoom()
		return slug, nil
	}
	return "", fmt.Errorf("No unique slug after %d attempts", maxSlugAttempts)
}

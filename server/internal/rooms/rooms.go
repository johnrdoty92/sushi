package rooms

import (
	"errors"
	"fmt"
	"sync"

	"github.com/sio/coolname"
)

const (
	maxSlugAttempts      = 10
	defaultMessageBuffer = 16
)

var (
	ErrRoomNotFound = errors.New("room does not exist")
)

type Subscriber struct {
	Name                string
	Messages            chan []byte
	CloseSlowConnection func()
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

func (r *Room) AddSubscriber(name string, handleSlowConnection func()) *Subscriber {
	sub := &Subscriber{
		Name:                name,
		Messages:            make(chan []byte, r.buffer),
		CloseSlowConnection: handleSlowConnection,
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
			s.CloseSlowConnection()
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

func (rm *RoomManager) Get(slug string) (*Room, error) {
	rm.mu.Lock()
	defer rm.mu.Unlock()
	room, ok := rm.rooms[slug]
	if !ok {
		return nil, ErrRoomNotFound
	}
	return room, nil
}

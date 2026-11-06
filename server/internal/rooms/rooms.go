package rooms

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sio/coolname"
)

const (
	maxSlugAttempts      = 10
	defaultMessageBuffer = 16
)

var (
	ErrRoomNotFound = errors.New("room does not exist")
)

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type SubscriberState struct {
	Id       string   `json:"id"`
	Name     string   `json:"name"`
	Position Position `json:"position"`
}

type RoomState struct {
	Subscribers []SubscriberState `json:"subscribers"`
}

type Subscriber struct {
	Id                  string
	Name                string
	Messages            chan []byte
	CloseSlowConnection func()
	position            Position
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
		Id:                  uuid.NewString(),
		Name:                name,
		Messages:            make(chan []byte, r.buffer),
		CloseSlowConnection: handleSlowConnection,
		position:            Position{X: 0, Y: 0},
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

func (r *Room) Run(ctx context.Context, ticks <-chan time.Time) error {
	for {
		select {
		case <-ticks:
			payload, err := json.Marshal(r.Snapshot())
			if err != nil {
				return err
			}
			for s := range r.subscribers {
				s.Messages <- payload
			}
		case <-ctx.Done():
			return nil
		}
	}
}

func (r *Room) Snapshot() RoomState {
	subscribers := make([]SubscriberState, 0)
	for s := range r.subscribers {
		subscribers = append(subscribers, SubscriberState{
			Id:       s.Id,
			Name:     s.Name,
			Position: s.position,
		})
	}
	return RoomState{
		Subscribers: subscribers,
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

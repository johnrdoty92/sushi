package rooms

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sio/coolname"
)

const (
	maxSlugAttempts      = 10
	defaultMessageBuffer = 16
	itemSpawnIntervalMs  = 3000
	gameDuration         = time.Minute * 2
)

var (
	ErrRoomNotFound       = errors.New("room does not exist")
	ErrPlayerNotFound     = errors.New("player does not exist")
	ErrGameAlreadyStarted = errors.New("game already started")
	ErrGameNotStarted     = errors.New("game not started")
	ErrItemNotFound       = errors.New("item not found")
	ErrItemAlreadyClaimed = errors.New("item already claimed")
	ErrItemNotVisible     = errors.New("item not visible yet")
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

type ItemState struct {
	Id       string   `json:"id"`
	OwnerId  string   `json:"ownerId"`
	Position Position `json:"position"`
	Visible  bool     `json:"visible"`
}

type RoomState struct {
	Subscribers   []SubscriberState `json:"subscribers"`
	Items         []ItemState       `json:"items"`
	TimeRemaining int               `json:"timeRemaining"`
}

type Subscriber struct {
	Id                  string
	Name                string
	Messages            chan []byte
	CloseSlowConnection func()
	position            Position
}

type item struct {
	Id        string
	OwnerId   string
	position  Position
	visibleAt time.Time
}

type Room struct {
	mu                sync.Mutex
	subscribers       map[*Subscriber]struct{}
	items             []item
	buffer            int
	endTime           time.Time
	itemSpawnInterval int
	gameDuration      time.Duration
	now               func() time.Time
}

func NewRoom() *Room {
	return &Room{
		subscribers:       make(map[*Subscriber]struct{}),
		items:             make([]item, 0),
		buffer:            defaultMessageBuffer,
		itemSpawnInterval: itemSpawnIntervalMs,
		gameDuration:      gameDuration,
		now:               time.Now,
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

func (r *Room) RemoveSubscriber(subscriber *Subscriber) {
	delete(r.subscribers, subscriber)
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

func (r *Room) UpdatePlayerPosition(id string, x float64, y float64) error {
	for s := range r.subscribers {
		if s.Id == id {
			s.position.X = max(min(x, 1), -1)
			s.position.Y = max(min(y, 1), -1)
			return nil
		}
	}
	return ErrPlayerNotFound
}

func (r *Room) Run(ctx context.Context, ticks <-chan time.Time) error {
	for {
		select {
		case now := <-ticks:
			payload, err := json.Marshal(r.Snapshot(now))
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

func (r *Room) Start() error {
	if !r.endTime.IsZero() {
		return ErrGameAlreadyStarted
	}
	r.endTime = r.now().Add(r.gameDuration)
	totalItemCount := int(r.gameDuration.Milliseconds()) / r.itemSpawnInterval
	r.initializeItems(totalItemCount)
	return nil
}

func (r *Room) Snapshot(tick time.Time) RoomState {
	subscribers := make([]SubscriberState, 0)
	for s := range r.subscribers {
		subscribers = append(subscribers, SubscriberState{
			Id:       s.Id,
			Name:     s.Name,
			Position: s.position,
		})
	}
	items := make([]ItemState, len(r.items))
	for idx, item := range r.items {
		items[idx] = ItemState{
			Id:       item.Id,
			OwnerId:  item.OwnerId,
			Position: item.position,
			Visible:  !tick.Before(item.visibleAt),
		}
	}
	return RoomState{
		Subscribers:   subscribers,
		Items:         items,
		TimeRemaining: r.getTimeRemaining(tick),
	}
}

func (r *Room) ClaimItem(playerId string, itemId string) error {
	for s := range r.subscribers {
		if s.Id != playerId {
			continue
		}
		if r.endTime.IsZero() {
			return ErrGameNotStarted
		}
		for idx := range r.items {
			item := &r.items[idx]
			if item.Id != itemId {
				continue
			}
			if r.now().Before(item.visibleAt) {
				return ErrItemNotVisible
			}
			if item.OwnerId != "" {
				return ErrItemAlreadyClaimed
			}
			item.OwnerId = playerId
			return nil

		}
		return ErrItemNotFound
	}
	return ErrPlayerNotFound
}

func (r *Room) getTimeRemaining(tick time.Time) int {
	if r.endTime.IsZero() {
		return -1
	}
	return max(int(r.endTime.Sub(tick).Milliseconds()), 0)
}

func (r *Room) initializeItems(totalItemCount int) {
	r.items = make([]item, totalItemCount)
	for idx := range r.items {
		item := &r.items[idx]
		item.Id = uuid.NewString()
		item.position = Position{X: randomCoordComponent(), Y: randomCoordComponent()}
		startTime := r.endTime.Add(r.gameDuration * -1)
		item.visibleAt = startTime.Add(time.Duration(float64(r.gameDuration) * (float64(idx+1) / float64(totalItemCount))))
	}
}

func randomCoordComponent() float64 {
	return rand.Float64()*2 - 1
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

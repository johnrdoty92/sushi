package rooms

import (
	"context"
	"encoding/json"
	"reflect"
	"testing"
	"time"
)

const stressTestCount = 10_000

func TestRoomManager_Create(t *testing.T) {
	rm := NewRoomManager()
	for range stressTestCount {
		_, err := rm.Create()
		if err != nil {
			t.Errorf("got %v, expected no errors", err)
		}
	}
}

func TestRoom_AddSubscriber(t *testing.T) {
	room := NewRoom()
	got := len(room.subscribers)
	want := 0
	if got != want {
		t.Fatalf("wanted %d, got %d", want, got)
	}
	room.AddSubscriber("Alice", func() {})
	got = len(room.subscribers)
	want = 1
	if got != want {
		t.Fatalf("wanted %d, got %d", want, got)
	}
}

func TestRoom_RemoveSubscriber(t *testing.T) {
	room := NewRoom()
	sub := room.AddSubscriber("Alice", func() {})
	got := len(room.subscribers)
	want := 1
	if got != want {
		t.Fatalf("wanted %d, got %d", want, got)
	}
	room.RemoveSubscriber(sub)
	got = len(room.subscribers)
	want = 0
	if got != want {
		t.Fatalf("wanted %d, got %d", want, got)
	}
}

func TestRoom_Publish(t *testing.T) {
	room := NewRoom()
	sub := room.AddSubscriber("Alice", func() {})
	message := "some message"
	go room.Publish([]byte(message))
	received := string(<-sub.Messages)
	if received != message {
		t.Errorf("got %s, want %s", received, message)
	}
}

func TestRoom_Run(t *testing.T) {
	room := NewRoom()
	sub := room.AddSubscriber("Alice", func() {})
	ctx, cancel := context.WithCancel(t.Context())

	ticks := make(chan time.Time, 1)
	errc := make(chan error, 1)

	go func() {
		errc <- room.Run(ctx, ticks)
	}()
	ticks <- time.Time{}

	select {
	case message := <-sub.Messages:
		var received RoomState
		if err := json.Unmarshal(message, &received); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		want := RoomState{
			Subscribers: []SubscriberState{{
				Id:       sub.Id,
				Name:     sub.Name,
				Position: Position{X: 0, Y: 0},
			}}}
		if !reflect.DeepEqual(received, want) {
			t.Fatalf("got %+v, want %+v", received, want)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out: subscriber did not receive message")
	}

	cancel()
	if err := <-errc; err != nil {
		t.Fatalf("room.Run: %v", err)
	}
}

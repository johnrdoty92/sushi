package rooms

import (
	"context"
	"encoding/json"
	"errors"
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
			}},
			Items:         []ItemState{},
			TimeRemaining: -1,
		}
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

func TestRoom_UpdatePlayerPosition(t *testing.T) {
	t.Run("should fail if player doesn't exist", func(t *testing.T) {
		room := NewRoom()
		err := room.UpdatePlayerPosition("non-existant id", 1, 1)
		if err == nil {
			t.Errorf("expected to get error, but didn't")
		}
	})
	t.Run("should update player position but clamp to -1 and 1", func(t *testing.T) {
		room := NewRoom()
		sub := room.AddSubscriber("Alice", func() {})
		err := room.UpdatePlayerPosition(sub.Id, 1, 1)
		if err != nil {
			t.Fatal(err)
		}

		want := Position{X: 1, Y: 1}
		if sub.position != want {
			t.Fatalf("got %v, want %v", sub.position, want)
		}
		err = room.UpdatePlayerPosition(sub.Id, 2, 2)
		if err != nil {
			t.Fatal(err)
		}
		if sub.position != want {
			t.Fatalf("got %v, want %v", sub.position, want)
		}

		err = room.UpdatePlayerPosition(sub.Id, -2, -2)
		want = Position{X: -1, Y: -1}
		if err != nil {
			t.Fatal(err)
		}
		if sub.position != want {
			t.Fatalf("got %v, want %v", sub.position, want)
		}
	})
}

func TestRoom_Start(t *testing.T) {
	t.Run("should display -1 for game not started and time remaining otherwise", func(t *testing.T) {
		room := NewRoom()
		room.gameDuration = time.Millisecond * 10
		sub := room.AddSubscriber("Alice", func() {})
		ctx, cancel := context.WithCancel(t.Context())

		ticks := make(chan time.Time, 3)
		errc := make(chan error, 1)

		go func() {
			errc <- room.Run(ctx, ticks)
		}()

		ticks <- time.Now()
		roomState := awaitState(t, sub.Messages)
		want := -1
		if roomState.TimeRemaining != want {
			t.Fatalf("got %v, want %v", roomState.TimeRemaining, want)
		}

		room.Start()
		from := room.endTime
		ticks <- from.Add(time.Millisecond * -5)
		roomState = awaitState(t, sub.Messages)
		if roomState.TimeRemaining <= 0 {
			t.Fatalf("got %v, wanted something more than 0", roomState.TimeRemaining)
		}

		ticks <- from.Add(time.Millisecond * 20)
		roomState = awaitState(t, sub.Messages)
		want = 0
		if roomState.TimeRemaining != want {
			t.Fatalf("got %v, want %v", roomState.TimeRemaining, want)
		}

		cancel()
		if err := <-errc; err != nil {
			t.Fatalf("room.Run: %v", err)
		}
	})

	t.Run("should fail if already started", func(t *testing.T) {
		room := NewRoom()
		room.gameDuration = time.Millisecond * 100
		err := room.Start()
		if err != nil {
			t.Fatal(err)
		}

		err = room.Start()
		if err == nil {
			t.Fatal("should fail to start a second time if time is left on the clock")
		}
	})

	t.Run("should initialize items", func(t *testing.T) {
		room := NewRoom()
		room.itemSpawnInterval = 10
		room.gameDuration = time.Millisecond * 100
		sub := room.AddSubscriber("Alice", func() {})
		ctx, cancel := context.WithCancel(t.Context())

		ticks := make(chan time.Time, 3)
		errc := make(chan error, 1)

		go func() {
			errc <- room.Run(ctx, ticks)
		}()

		err := room.Start()
		if err != nil {
			t.Fatal(err)
		}

		expectedItemLength := int(room.gameDuration.Milliseconds()) / room.itemSpawnInterval
		got := len(room.items)
		if got != expectedItemLength {
			t.Fatalf("got %v, want %v", got, expectedItemLength)
		}

		start := room.endTime.Add(room.gameDuration * -1)
		halfway := room.endTime.Add(room.gameDuration / -2)
		end := room.endTime
		tests := []time.Time{start, halfway, end}
		for idx, tick := range tests {
			ticks <- tick
			roomState := awaitState(t, sub.Messages)
			if len(roomState.Items) != expectedItemLength {
				t.Fatalf("got %v, want %v", len(roomState.Items), expectedItemLength)
			}
			for i, item := range roomState.Items {
				expectedVisibility := (float64(i+1) / float64(len(roomState.Items))) <= (float64(tick.Sub(start).Milliseconds()) / float64(room.gameDuration.Milliseconds()))
				if item.Visible != expectedVisibility {
					t.Errorf("test %d: got %v want %v for item %d's visibility", idx, item.Visible, expectedVisibility, i)
				}
			}
		}

		cancel()
		if err := <-errc; err != nil {
			t.Fatalf("room.Run: %v", err)
		}
	})

	t.Run("should mark all as visible by end of game", func(t *testing.T) {
		//
	})
}

func TestRoom_ClaimItem(t *testing.T) {
	room := NewRoom()
	room.itemSpawnInterval = 10
	room.gameDuration = time.Millisecond * 100
	now := time.Now()
	room.now = func() time.Time { return now }
	sub1 := room.AddSubscriber("Alice", func() {})
	sub2 := room.AddSubscriber("Bob", func() {})

	err := room.ClaimItem("non-existant-player-id", "")
	if err == nil {
		t.Fatal("expected error for non-existant player id")
	}

	err = room.ClaimItem(sub1.Id, "")
	if err == nil {
		t.Fatal("expected error for game not started")
	}

	err = room.Start()
	if err != nil {
		t.Fatal(err)
	}

	err = room.ClaimItem(sub1.Id, "non-existant-item-id")
	if err == nil {
		t.Fatal("expected error for non-existant item id")
	}

	lastItem := room.items[len(room.items)-1]
	err = room.ClaimItem(sub1.Id, lastItem.Id)
	if err == nil {
		t.Fatal("expected error for item not yet visible")
	}

	now = room.items[0].visibleAt
	err = room.ClaimItem(sub1.Id, room.items[0].Id)
	if err != nil {
		t.Fatalf("unexpectedly failed to claim item: %v", err)
	}

	err = room.ClaimItem(sub2.Id, room.items[0].Id)
	if err == nil {
		t.Fatal("expected error for item already claimed")
	}
}

func TestRoom_Reset(t *testing.T) {
	t.Run("should fail if the room is already reset", func(t *testing.T) {
		room := NewRoom()
		err := room.Reset()
		if !errors.Is(err, ErrGameAlreadyReset) {
			t.Fatalf("got %v, want %v", err, ErrGameAlreadyReset)
		}
	})

	t.Run("should fail while the game is in progress", func(t *testing.T) {
		room := NewRoom()
		now := time.Now()
		room.now = func() time.Time { return now }
		room.gameDuration = time.Second
		room.itemSpawnInterval = 10
		if err := room.Start(); err != nil {
			t.Fatal(err)
		}
		itemsBefore := len(room.items)

		now = room.endTime.Add(time.Millisecond * -1)
		err := room.Reset()
		if !errors.Is(err, ErrGameAlreadyStarted) {
			t.Fatalf("got %v, want %v", err, ErrGameAlreadyStarted)
		}
		if room.endTime.IsZero() {
			t.Fatal("reset cleared endTime while the game was still in progress")
		}
		if len(room.items) != itemsBefore {
			t.Fatalf("reset cleared items while the game was still in progress: got %d, want %d", len(room.items), itemsBefore)
		}
	})

	t.Run("should reset after the game ends and allow another start", func(t *testing.T) {
		room := NewRoom()
		now := time.Now()
		room.now = func() time.Time { return now }
		room.gameDuration = time.Second
		room.itemSpawnInterval = 10
		if err := room.Start(); err != nil {
			t.Fatal(err)
		}
		itemsBefore := len(room.items)
		oldItemId := room.items[0].Id

		now = room.endTime
		if err := room.Reset(); err != nil {
			t.Fatal(err)
		}
		if !room.endTime.IsZero() {
			t.Fatalf("got endTime %v, want zero time", room.endTime)
		}
		if len(room.items) != 0 {
			t.Fatalf("got %d items after reset, want 0", len(room.items))
		}
		state := room.Snapshot(now)
		if state.TimeRemaining != -1 || len(state.Items) != 0 {
			t.Fatalf("got %+v after reset, want no items and -1 time remaining", state)
		}

		if err := room.Reset(); !errors.Is(err, ErrGameAlreadyReset) {
			t.Fatalf("got %v, want %v", err, ErrGameAlreadyReset)
		}

		if err := room.Start(); err != nil {
			t.Fatalf("Start after Reset: %v", err)
		}
		if len(room.items) != itemsBefore {
			t.Fatalf("got %d items after restart, want %d", len(room.items), itemsBefore)
		}
		if room.items[0].Id == oldItemId {
			t.Fatal("expected reset to generate new items")
		}
	})
}

func awaitState(t *testing.T, messages chan []byte) *RoomState {
	t.Helper()
	select {
	case message := <-messages:
		var state RoomState
		if err := json.Unmarshal(message, &state); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		return &state
	case <-time.After(time.Second):
		t.Fatal("timed out: subscriber did not receive message")
		return nil
	}
}

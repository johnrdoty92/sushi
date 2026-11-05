package rooms

import (
	"testing"
)

const stressTestCount = 10_000

func TestCreate(t *testing.T) {
	rm := NewRoomManager()
	for range stressTestCount {
		_, err := rm.Create()
		if err != nil {
			t.Errorf("got %v, expected no errors", err)
		}
	}
}

func TestRoom(t *testing.T) {
	room := NewRoom()
	sub := room.AddSubscriber("Alice")
	message := "some message"
	go room.Publish([]byte(message))
	received := string(<-sub.Messages)
	if received != message {
		t.Errorf("got %s, want %s", received, message)
	}

}

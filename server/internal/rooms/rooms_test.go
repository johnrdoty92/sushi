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

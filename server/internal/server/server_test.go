package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/johnrdoty92/sushi/server/internal/rooms"
)

func TestCreateGame(t *testing.T) {
	t.Run("should create game entry", func(t *testing.T) {
		url, close := setupServer(t)
		defer close()

		request, _ := http.NewRequest(http.MethodPost, url+"/rooms", nil)
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}

		defer response.Body.Close()
		if response.StatusCode != http.StatusCreated {
			t.Errorf("got %v status, want %v", response.StatusCode, http.StatusCreated)
		}

		slugBytes, err := io.ReadAll(response.Body)
		if err != nil {
			t.Fatal(err)
		}
		slug := string(slugBytes)
		twoWordsHyphenatedRegexp := regexp.MustCompile(`^[a-z]+-[a-z]+$`)
		if !twoWordsHyphenatedRegexp.MatchString(slug) {
			t.Errorf("wanted two words connected with hyphen, got %v", slug)
		}
	})
}

func TestJoinGame(t *testing.T) {
	t.Run("should successfully join room", func(t *testing.T) {
		url, close := setupServer(t)
		defer close()

		request, _ := http.NewRequest(http.MethodPost, url+"/rooms", nil)
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}

		defer response.Body.Close()
		slugBytes, err := io.ReadAll(response.Body)
		if err != nil {
			t.Fatal(err)
		}
		slug := string(slugBytes)

		cl, response, err := newClient(context.Background(), url, slug, "Alice")
		if cl == nil {
			t.Fatal(err)
		}
		if response.StatusCode != http.StatusSwitchingProtocols {
			t.Fatalf("got %d, wanted %d", response.StatusCode, http.StatusSwitchingProtocols)
		}
	})

	t.Run("should fail if name not provided", func(t *testing.T) {
		url, close := setupServer(t)
		defer close()

		_, response, _ := newClient(context.Background(), url, "non-existent-slug", "")

		if response.StatusCode != http.StatusBadRequest {
			t.Fatalf("got %d, want %d", response.StatusCode, http.StatusBadRequest)
		}
	})

	t.Run("should fail for non-existent rooms", func(t *testing.T) {
		url, close := setupServer(t)
		defer close()

		_, response, _ := newClient(context.Background(), url+"?name=Alice", "non-existent-slug", "Alice")

		if response.StatusCode != http.StatusNotFound {
			t.Fatalf("got %d, want %d", response.StatusCode, http.StatusNotFound)
		}
	})

	t.Run("should send user's newly created id as first message", func(t *testing.T) {
		url, close := setupServer(t)
		defer close()

		request, _ := http.NewRequest(http.MethodPost, url+"/rooms", nil)
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}

		defer response.Body.Close()
		slugBytes, err := io.ReadAll(response.Body)
		if err != nil {
			t.Fatal(err)
		}
		slug := string(slugBytes)

		cl, response, err := newClient(context.Background(), url, slug, "Alice")
		if cl == nil {
			t.Fatal(err)
		}

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		_, message, err := cl.conn.Read(ctx)
		var idPayload rooms.SubscriberId
		if err := json.Unmarshal(message, &idPayload); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
	})
}

func TestUpdatePlayer(t *testing.T) {
	t.Run("should update an existing player", func(t *testing.T) {
		_, _, url, slug, cl, close := setupJoinedServer(t)
		defer close()

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		_, message, err := cl.conn.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
		idPayload := decode[rooms.SubscriberId](t, message)

		position := rooms.Position{X: 0.5, Y: -0.5}
		body := encode(t, rooms.SubscriberState{
			Id:       idPayload.Id,
			Name:     "Alice",
			Position: position,
		})
		request, err := http.NewRequest(http.MethodPost, url+"/rooms/"+slug+"/players", bytes.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode < 200 || response.StatusCode >= 300 {
			t.Fatalf("got %d updating player, want a successful status", response.StatusCode)
		}

		awaitPayload(t, cl, func(state rooms.RoomState) bool {
			for _, subscriber := range state.Subscribers {
				if subscriber.Id == idPayload.Id && subscriber.Position == position {
					return true
				}
			}
			return false
		})
	})

	t.Run("should fail for a player that doesn't exist", func(t *testing.T) {
		_, _, url, slug, _, close := setupJoinedServer(t)
		defer close()

		body := encode(t, rooms.SubscriberState{
			Id:       "non-existent-player-id",
			Name:     "Nobody",
			Position: rooms.Position{X: 0.5, Y: -0.5},
		})
		request, err := http.NewRequest(http.MethodPost, url+"/rooms/"+slug+"/players", bytes.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode >= 200 && response.StatusCode < 300 {
			t.Fatalf("got %d updating a missing player, want a failing status", response.StatusCode)
		}
	})
}

func awaitPayload[T any](t *testing.T, cl *client, match func(T) bool) T {
	t.Helper()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	for {
		_, message, err := cl.conn.Read(ctx)
		if err != nil {
			t.Fatalf("failed waiting for websocket message: %v", err)
		}
		payload := decode[T](t, message)
		if match(payload) {
			return payload
		}
	}
}

func encode[T any](t *testing.T, v T) []byte {
	t.Helper()

	data, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("failed to marshal %T: %v", v, err)
	}
	return data
}

func decode[T any](t *testing.T, data []byte) T {
	t.Helper()

	var v T
	if err := json.Unmarshal(data, &v); err != nil {
		t.Fatalf("failed to unmarshal into %T: %v", v, err)
	}
	return v
}

func TestStartGame(t *testing.T) {
	t.Run("should only start game once", func(t *testing.T) {
		_, _, url, slug, _, close := setupJoinedServer(t)
		defer close()

		request, err := http.NewRequest(http.MethodPost, url+"/rooms/"+slug+"/start", nil)
		if err != nil {
			t.Fatal(err)
		}
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusCreated {
			t.Fatalf("got %d starting game, want %d", response.StatusCode, http.StatusCreated)
		}

		request, err = http.NewRequest(http.MethodPost, url+"/rooms/"+slug+"/start", nil)
		if err != nil {
			t.Fatal(err)
		}
		response, err = http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusBadRequest {
			t.Fatalf("got %d starting game a second time, want %d", response.StatusCode, http.StatusBadRequest)
		}
	})
}

func TestClaimItem(t *testing.T) {
	t.Run("should claim an item only once", func(t *testing.T) {
		gs, _, url, slug, cl, close := setupJoinedServer(t)
		defer close()

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()
		_, message, err := cl.conn.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
		idPayload := decode[rooms.SubscriberId](t, message)

		room, err := gs.RoomManager.Get(slug)
		if err != nil {
			t.Fatal(err)
		}
		room.SetTiming(200*time.Millisecond, 20*time.Millisecond)

		request, err := http.NewRequest(http.MethodPost, url+"/rooms/"+slug+"/start", nil)
		if err != nil {
			t.Fatal(err)
		}
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusCreated {
			t.Fatalf("got %d starting game, want %d", response.StatusCode, http.StatusCreated)
		}

		state := awaitPayload(t, cl, func(state rooms.RoomState) bool {
			return len(state.Items) > 0 && state.Items[0].Visible
		})

		body := encode(t, ClaimItemPayload{
			PlayerId: idPayload.Id,
			ItemId:   state.Items[0].Id,
		})
		request, err = http.NewRequest(http.MethodPatch, url+"/rooms/"+slug+"/items", bytes.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		response, err = http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode < 200 || response.StatusCode >= 300 {
			t.Fatalf("got %d claiming item, want a successful status", response.StatusCode)
		}

		request, err = http.NewRequest(http.MethodPatch, url+"/rooms/"+slug+"/items", bytes.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		response, err = http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode >= 200 && response.StatusCode < 300 {
			t.Fatalf("got %d claiming an already claimed item, want a failing status", response.StatusCode)
		}
	})
}

func setupServer(t *testing.T) (url string, closeFn func()) {
	gs := NewGameServer()
	gs.logf = t.Logf
	server := httptest.NewServer(&gs.Mux)
	return server.URL, func() {
		server.Close()
	}
}

func setupJoinedServer(t *testing.T) (gs *GameServer, server *httptest.Server, url string, slug string, cl *client, closeFn func()) {
	t.Helper()

	gs = NewGameServer()
	gs.logf = t.Logf
	server = httptest.NewServer(&gs.Mux)
	t.Cleanup(server.Close)
	url = server.URL

	request, err := http.NewRequest(http.MethodPost, url+"/rooms", nil)
	if err != nil {
		t.Fatal(err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusCreated {
		t.Fatalf("got %d creating room, want %d", response.StatusCode, http.StatusCreated)
	}

	slugBytes, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	slug = string(slugBytes)

	cl, _, err = newClient(context.Background(), url, slug, "Alice")
	if err != nil {
		t.Fatalf("failed to join room %q: %v", slug, err)
	}

	closeFn = func() {
		cl.conn.CloseNow()
		server.Close()
	}
	return gs, server, url, slug, cl, closeFn
}

type client struct {
	conn *websocket.Conn
}

func newClient(ctx context.Context, url string, slug string, name string) (*client, *http.Response, error) {
	conn, response, err := websocket.Dial(ctx, url+"/rooms/"+slug+"?name="+name, nil)
	if err != nil {
		return nil, response, err
	}
	cl := &client{
		conn: conn,
	}
	return cl, response, nil
}

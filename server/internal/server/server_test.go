package server

import (
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

func setupServer(t *testing.T) (url string, closeFn func()) {
	gs := NewGameServer()
	gs.logf = t.Logf
	server := httptest.NewServer(&gs.Mux)
	return server.URL, func() {
		server.Close()
	}
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

package server

import (
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
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

func setupServer(t *testing.T) (url string, closeFn func()) {
	gs := NewGameServer()
	gs.logf = t.Logf
	server := httptest.NewServer(&gs.Mux)
	return server.URL, func() {
		server.Close()
	}
}

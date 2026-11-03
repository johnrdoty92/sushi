package server

import (
	"fmt"
	"net/http"
)

func NewServer() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Hello, Sushi")
	})
	return mux
}

package main

import (
	"log"
	"net/http"

	"github.com/johnrdoty92/sushi/server/internal/server"
)

func main() {
	handler := server.NewServer()
	log.Fatal(http.ListenAndServe(":5001", handler))
}

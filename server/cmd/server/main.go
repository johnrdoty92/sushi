package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/johnrdoty92/sushi/server/internal/server"
	"github.com/rs/cors"
)

func main() {
	ctx := context.Background()
	if err := run(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	signalCtx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	gameServer := server.NewGameServer()

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins: []string{os.Getenv("CLIENT_ORIGIN")},
		AllowedMethods: []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodOptions, http.MethodDelete},
		AllowedHeaders: []string{"Content-Type"},
	})

	handler := corsMiddleware.Handler(&gameServer.Mux)

	httpServer := &http.Server{
		Handler: handler,
		Addr:    net.JoinHostPort(os.Getenv("HOST"), os.Getenv("PORT")),
	}
	go func() {
		log.Printf("Listening on %s\n", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil {
			fmt.Fprintf(os.Stderr, "Error listening and serving: %s\n", err)
		}
	}()

	var wg sync.WaitGroup
	wg.Go(func() {
		<-signalCtx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			fmt.Fprintf(os.Stderr, "Error shutting down server: %s\n", err)
		}
	})
	wg.Wait()
	return nil
}

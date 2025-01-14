package main

import (
	"fmt"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"log"
	"main/adder"
	"main/presentation"
	"main/repository"
	"net/http"
)

func main() {
	result := adder.Add(2, 3)
	fmt.Println("Result:", result)
	// Initialize the database connection
	repository.InitDB("")

	router := mux.NewRouter()

	// Register endpoints
	presentation.RegisterDeviceHandlers(router)

	// Set up CORS options
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	log.Println("Starting server on :8000")
	if err := http.ListenAndServe(":8000", handler); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

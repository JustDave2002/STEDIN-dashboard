package main

import (
	"context"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"k8s.io/client-go/tools/clientcmd"
	"log"
	"main/adder"
	"main/k8sclient"
	"main/presentation"
	"main/repository"
	"net/http"
)

func main() {
	result := adder.Add(2, 3)
	fmt.Println("Result:", result)
	repository.InitDB("")

	kubeconfig := "/mnt/c/Users/lucag/.kube/config"
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Fatalf("Failed to load kubeconfig: %v", err)
	}

	clientset, err := k8sclient.InitK8sClient(config)
	if err != nil {
		log.Fatalf("Failed to initialize Kubernetes client: %v", err)
	}

	// Create a shared context
	ctx := context.Background()

	router := mux.NewRouter()

	presentation.RegisterDeviceHandlers(router, clientset, ctx)

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

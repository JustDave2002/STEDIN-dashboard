package presentation

import (
	"context"
	"github.com/gorilla/mux"
	"k8s.io/client-go/kubernetes"
	"main/handler"
	"main/middleware"
	"net/http"
)

func RegisterDeviceHandlers(router *mux.Router, clientset *kubernetes.Clientset, ctx context.Context) {
	router.Handle("/map", middleware.AuthenticateMeber(http.HandlerFunc(handler.GetAllDevicesMapHandler))).Methods("GET")

	router.Handle("/devices", middleware.AuthenticateMeber(http.HandlerFunc(handler.GetAllDevicesHandler))).Methods("GET")

	router.HandleFunc("/mebers", handler.GetAllMebersHandler).Methods("GET")
	router.HandleFunc("/api/login", handler.LoginHandler).Methods("POST")

	router.HandleFunc("/appstore", handler.AppStoreHandler).Methods("GET")
	router.Handle("/eligible-devices", middleware.AuthenticateMeber(http.HandlerFunc(handler.EligibleDevicesHandler))).Methods("POST")

	// Updated: Pass clientset and ctx to AddApplicationsToDevicesHandler
	router.Handle("/add-applications", middleware.AuthenticateMeber(http.HandlerFunc(
		func(w http.ResponseWriter, r *http.Request) {
			handler.AddApplicationsToDevicesHandler(w, r, clientset, ctx)
		},
	))).Methods("POST")

	router.Handle("/logs", middleware.AuthenticateMeber(http.HandlerFunc(handler.LogsHandler))).Methods("GET")
}

package presentation

import (
	"github.com/gorilla/mux"
	"main/handler"
	"main/middleware"
	"net/http"
)

func RegisterDeviceHandlers(router *mux.Router) {
	router.Handle("/map", middleware.AuthenticateMeber(http.HandlerFunc(handler.GetAllDevicesMapHandler))).Methods("GET")
	// TODO rework: for /devices, return devices with appropriate attributes: device info, tags, application
	router.Handle("/devices", middleware.AuthenticateMeber(http.HandlerFunc(handler.GetAllDevicesHandler))).Methods("GET")

	// For handling meber functionality, AKA RBAC
	router.HandleFunc("/mebers", handler.GetAllMebersHandler).Methods("GET")
	router.HandleFunc("/api/login", handler.LoginHandler).Methods("POST")

	router.HandleFunc("/appstore", handler.AppStoreHandler).Methods("GET")
	router.Handle("/eligible-devices", middleware.AuthenticateMeber(http.HandlerFunc(handler.EligibleDevicesHandler))).Methods("POST")
	router.Handle("/add-applications", middleware.AuthenticateMeber(http.HandlerFunc(handler.AddApplicationsToDevicesHandler))).Methods("POST")

	router.Handle("/logs", middleware.AuthenticateMeber(http.HandlerFunc(handler.LogsHandler))).Methods("GET")
}

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
	router.HandleFunc("/devices", handler.GetAllDevicesHandler).Methods("GET")

	// For handling meber functionality, AKA RBAC
	router.HandleFunc("/mebers", handler.GetAllMebersHandler).Methods("GET")
	router.HandleFunc("/api/login", handler.LoginHandler).Methods("POST")

}

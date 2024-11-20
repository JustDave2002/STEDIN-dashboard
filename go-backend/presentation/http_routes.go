package presentation

import (
	"github.com/gorilla/mux"
	"main/handler"
	"main/middleware"
	"net/http"
)

func RegisterDeviceHandlers(router *mux.Router) {
	// TODO rework: for /map, make it so it returns what is needed for map (so change handlers, service, repo, etc)
	router.Handle("/map", middleware.AuthMiddleware(http.HandlerFunc(handler.GetAllDevicesMapHandler))).Methods("GET")
	// TODO rework: for /devices, return devices with appropriate attributes: device info, tags, application
	router.HandleFunc("/devices", handler.GetAllDevicesHandler).Methods("GET")
	router.HandleFunc("/mebers", handler.GetAllMebersHandler).Methods("GET")
}

package handler

import (
	"encoding/json"
	"main/middleware"
	"net/http"
	"strconv"

	"main/service"
)

func GetDeviceHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()
	deviceIDStr := queryParams.Get("id")
	if deviceIDStr == "" {
		http.Error(w, "Device ID is required", http.StatusBadRequest)
		return
	}

	deviceID, err := strconv.ParseInt(deviceIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid device ID", http.StatusBadRequest)
		return
	}

	device, err := service.GetEdgeDevice(deviceID)
	if err != nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(device)
}

func GetAllDevicesHandler(w http.ResponseWriter, r *http.Request) {
	devices, err := service.GetAllDevicesWithApplications()
	if err != nil {
		http.Error(w, "Error retrieving devices", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(devices)
}

func GetAllDevicesMapHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Extract user ID from context
	meberID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "User ID missing from context", http.StatusUnauthorized)
		return
	}

	devices, err := service.GetAllEdgeDevicesForMap(meberID)
	if err != nil {
		http.Error(w, "Error retrieving devices", http.StatusInternalServerError)
		return
	}

	// Step 3: Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(devices)
}

func GetAllMebersHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Call the service function to get all mebers
	mebers, err := service.GetAllMebers()
	if err != nil {
		http.Error(w, "Error retrieving mebers", http.StatusInternalServerError)
		return
	}

	// Step 2: Set response headers and write the response as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(mebers)
}

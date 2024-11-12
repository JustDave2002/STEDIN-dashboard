package handler

import (
	"encoding/json"
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
	devices, err := service.GetAllEdgeDevices()
	if err != nil {
		http.Error(w, "Error retrieving devices", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(devices)
}

package handler

import (
	"encoding/json"
	"github.com/dgrijalva/jwt-go"
	"main/middleware"
	"net/http"
	"strconv"
	"time"

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

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the request body to get the meber ID
	var requestBody struct {
		MeberID int64 `json:"meber_id"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Step 1: Verify that the meber exists
	meber, err := service.GetMeberByID(requestBody.MeberID)
	if err != nil {
		http.Error(w, "Meber not found", http.StatusUnauthorized)
		return
	}

	// Step 2: Generate a JWT for the user
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": meber.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token expiry (72 hours)
	})

	// Step 3: Sign the token with the secret key
	tokenString, err := token.SignedString(service.SecretKey)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Step 4: Return the token to the client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}

package handler

import (
	"encoding/json"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"main/middleware"
	"main/structs"
	"net/http"
	"strconv"
	"time"

	"main/service"
)

//func GetDeviceHandler(w http.ResponseWriter, r *http.Request) {
//	queryParams := r.URL.Query()
//	deviceIDStr := queryParams.Get("id")
//	if deviceIDStr == "" {
//		http.Error(w, "Device ID is required", http.StatusBadRequest)
//		return
//	}
//
//	deviceID, err := strconv.ParseInt(deviceIDStr, 10, 64)
//	if err != nil {
//		http.Error(w, "Invalid device ID", http.StatusBadRequest)
//		return
//	}
//
//	device, err := service.GetEdgeDevice(deviceID)
//	if err != nil {
//		http.Error(w, "Device not found", http.StatusNotFound)
//		return
//	}
//
//	w.Header().Set("Content-Type", "application/json")
//	w.WriteHeader(http.StatusOK)
//	json.NewEncoder(w).Encode(device)
//}

func GetAllDevicesHandler(w http.ResponseWriter, r *http.Request) {
	meberID, ok := r.Context().Value(middleware.MeberIDKey).(int64)
	if !ok {
		http.Error(w, "User ID missing from context", http.StatusUnauthorized)
		return
	}
	devices, err := service.GetAllDevicesWithApplications(meberID)
	if err != nil {
		http.Error(w, "Error retrieving devices", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(devices)
}

func GetAllDevicesMapHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Extract meber ID from context
	meberID, ok := r.Context().Value(middleware.MeberIDKey).(int64)
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

	// Step 2: Generate a JWT for the meber
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"meber_id": meber.ID,
		"exp":      time.Now().Add(time.Hour * 72).Unix(), // Token expiry (72 hours)
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

// AppStoreHandler handles the /appstore endpoint to return available applications and their associated sensor information
func AppStoreHandler(w http.ResponseWriter, r *http.Request) {
	applications, err := service.GetAppStoreData()
	if err != nil {
		http.Error(w, "Error retrieving applications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(applications)
}

// EligibleDevicesHandler handles the /eligible-devices endpoint to return eligible devices for an application
func EligibleDevicesHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Extract meber ID from JWT
	meberID, ok := r.Context().Value(middleware.MeberIDKey).(int64)
	if !ok {
		http.Error(w, "Meber ID missing from context", http.StatusUnauthorized)
		return
	}

	// Step 2: Parse the request body to get the application ID
	var requestBody struct {
		ApplicationID int64 `json:"application_id"`
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil || requestBody.ApplicationID == 0 { // Check if ApplicationID is missing or invalid
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Step 3: Get eligible devices
	eligibleDevices, err := service.GetEligibleDevices(meberID, requestBody.ApplicationID)
	if err != nil {
		http.Error(w, "Error retrieving eligible devices", http.StatusInternalServerError)
		return
	}

	// Step 4: Wrap the response
	response := struct {
		Devices []structs.EligibleDevice `json:"devices"`
	}{
		Devices: eligibleDevices,
	}

	// Step 5: Encode the wrapped response
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

// AddApplicationsToDevicesHandler handles the /add-applications endpoint to add applications to devices
func AddApplicationsToDevicesHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Extract user ID from JWT
	meberID, ok := r.Context().Value(middleware.MeberIDKey).(int64)
	if !ok {
		http.Error(w, "User ID missing from context", http.StatusUnauthorized)
		return
	}

	// Step 2: Parse the request body to get the device IDs and application ID
	var requestBody struct {
		AppID     int64   `json:"application_id"`
		DeviceIDs []int64 `json:"device_ids"`
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Step 3: Add application instances to devices
	err = service.AddApplicationsToDevices(meberID, requestBody.AppID, requestBody.DeviceIDs)
	if err != nil {
		http.Error(w, "Error adding applications to devices", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Applications added to devices successfully"))
}

func LogsHandler(w http.ResponseWriter, r *http.Request) {
	// Step 1: Extract query parameters (e.g., device ID, appInstanceID, date range, etc.)
	queryParams := r.URL.Query()
	deviceIDStr := queryParams.Get("device_id")
	appInstanceIDStr := queryParams.Get("app_instance_id")
	startDateStr := queryParams.Get("start_date")
	endDateStr := queryParams.Get("end_date")

	// Ensure at least one required query parameter is provided
	if deviceIDStr == "" && appInstanceIDStr == "" {
		http.Error(w, "Missing required query parameters: device_id or app_instance_id", http.StatusBadRequest)
		return
	}

	var deviceID, appInstanceID int64
	var err error

	// Validate and parse the device ID if provided
	if deviceIDStr != "" {
		deviceID, err = strconv.ParseInt(deviceIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid device ID", http.StatusBadRequest)
			return
		}
	}

	// Validate and parse the appInstanceID if provided
	if appInstanceIDStr != "" {
		appInstanceID, err = strconv.ParseInt(appInstanceIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid appInstanceID", http.StatusBadRequest)
			return
		}
	}

	// Validate and parse the start date and end date if provided
	var startDate, endDate *time.Time
	if startDateStr != "" {
		startDateParsed, err := time.Parse("2006-01-02", startDateStr)
		if err != nil {
			http.Error(w, "Invalid start date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		startDate = &startDateParsed
	}

	if endDateStr != "" {
		endDateParsed, err := time.Parse("2006-01-02", endDateStr)
		if err != nil {
			http.Error(w, "Invalid end date format, expected YYYY-MM-DD", http.StatusBadRequest)
			return
		}
		endDate = &endDateParsed
	}

	// Step 2: Call the service to get the logs based on query parameters
	logs, err := service.GetLogs(deviceID, appInstanceID, startDate, endDate)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error retrieving logs: %v", err), http.StatusInternalServerError)
		return
	}

	// Step 3: Respond with the logs in JSON format
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(logs)
}

package presentation_test

import (
	"bytes"
	"main/presentation"
	"main/repository"
	"main/service"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
)

// GenerateTestToken creates a valid JWT token for testing
func GenerateTestToken(meberID int64, secret []byte, exp time.Time) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"meber_id": meberID,
		"exp":      exp.Unix(),
	})
	tokenString, _ := token.SignedString(secret)
	return tokenString
}

func TestAllEndpoints(t *testing.T) {
	// Initialize the database connection for testing
	repository.InitDB("../.env")

	// Set up the router
	router := mux.NewRouter()
	presentation.RegisterDeviceHandlers(router)

	// Generate tokens for different scenarios
	validToken := GenerateTestToken(1, service.SecretKey, time.Now().Add(time.Hour))
	invalidToken := "invalid.token.structure"
	expiredToken := GenerateTestToken(1, service.SecretKey, time.Now().Add(-time.Hour))

	// Define the test cases
	testCases := []struct {
		name         string
		method       string
		path         string
		body         []byte
		authHeader   string
		expectedCode int
	}{
		// Map endpoints
		{"Valid Map Request", "GET", "/map", nil, "Bearer " + validToken, http.StatusOK},
		{"Map Request Without Authorization", "GET", "/map", nil, "", http.StatusUnauthorized},
		{"Map Request With Invalid Token", "GET", "/map", nil, "Bearer " + invalidToken, http.StatusUnauthorized},
		{"Map Request With Expired Token", "GET", "/map", nil, "Bearer " + expiredToken, http.StatusUnauthorized},

		// Devices endpoints
		{"Valid Devices Request", "GET", "/devices", nil, "Bearer " + validToken, http.StatusOK},
		{"Devices Request Without Authorization", "GET", "/devices", nil, "", http.StatusUnauthorized},
		{"Devices Request With Invalid Token", "GET", "/devices", nil, "Bearer " + invalidToken, http.StatusUnauthorized},
		{"Devices Request With Expired Token", "GET", "/devices", nil, "Bearer " + expiredToken, http.StatusUnauthorized},

		// Login endpoints
		{"Valid Login Request", "POST", "/api/login", []byte(`{"meber_id":1}`), "", http.StatusOK},
		{"Login With Invalid JSON", "POST", "/api/login", []byte(`{"meber_id":}`), "", http.StatusBadRequest},
		{"Login With Non-existent Meber ID", "POST", "/api/login", []byte(`{"meber_id":9999}`), "", http.StatusUnauthorized},

		// AppStore endpoint
		{"Valid AppStore Request", "GET", "/appstore", nil, "", http.StatusOK},

		//mebers endpoint
		{"Valid Meber Request", "GET", "/mebers", nil, "", http.StatusOK},
		// Eligible Devices endpoints
		{"Valid Eligible Devices Request", "POST", "/eligible-devices", []byte(`{"application_id":1}`), "Bearer " + validToken, http.StatusOK},
		//{"Eligible Devices With Non-existent Application ID", "POST", "/eligible-devices", []byte(`{"application_id":123456}`), "Bearer " + validToken, http.StatusInternalServerError},
		{"Eligible Devices With Invalid JSON", "POST", "/eligible-devices", []byte(`{"invalid_field":123}`), "Bearer " + validToken, http.StatusBadRequest},
		{"Eligible Devices Without Authorization", "POST", "/eligible-devices", nil, "", http.StatusUnauthorized},
		{"Eligible Devices With Invalid Token", "POST", "/eligible-devices", []byte(`{"application_id":1}`), "Bearer " + invalidToken, http.StatusUnauthorized},
		{"Eligible Devices With Expired Token", "POST", "/eligible-devices", []byte(`{"application_id":1}`), "Bearer " + expiredToken, http.StatusUnauthorized},

		// Add Applications to Devices endpoint
		{"Valid Add Applications Request", "POST", "/add-applications", []byte(`{"application_id":1,"device_ids":[1,2]}`), "Bearer " + validToken, http.StatusOK},
		//{"Add Applications With Invalid JSON", "POST", "/add-applications", []byte(`{"app":1}`), "Bearer " + validToken, http.StatusBadRequest},
		{"Add Applications Without Authorization", "POST", "/add-applications", nil, "", http.StatusUnauthorized},

		// Logs endpoint
		{"Valid Logs Request With Device ID", "GET", "/logs?device_id=1", nil, "Bearer " + validToken, http.StatusOK},
		{"Valid Logs Request With App Instance ID", "GET", "/logs?app_instance_id=2", nil, "Bearer " + validToken, http.StatusOK},
		{"Logs With Invalid Device ID", "GET", "/logs?device_id=abc", nil, "Bearer " + validToken, http.StatusBadRequest},
		{"Logs With Invalid App Instance ID", "GET", "/logs?app_instance_id=xyz", nil, "Bearer " + validToken, http.StatusBadRequest},
		{"Logs With Missing Parameters", "GET", "/logs", nil, "Bearer " + validToken, http.StatusBadRequest},
		{"Logs Without Authorization", "GET", "/logs?device_id=1", nil, "", http.StatusUnauthorized},
		{"Logs With Invalid Token", "GET", "/logs?device_id=1", nil, "Bearer " + invalidToken, http.StatusUnauthorized},
		{"Logs With Expired Token", "GET", "/logs?device_id=1", nil, "Bearer " + expiredToken, http.StatusUnauthorized},
	}

	// Iterate over the test cases
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			start := time.Now()

			// Create the request
			req := httptest.NewRequest(tc.method, tc.path, bytes.NewReader(tc.body))
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}

			// Create a response recorder
			rr := httptest.NewRecorder()

			// Serve the request
			router.ServeHTTP(rr, req)

			// Measure response time
			duration := time.Since(start)
			if duration > 500*time.Millisecond {
				t.Errorf("Performance test failed: response took %v, exceeding 500ms for %s %s", duration, tc.method, tc.path)
			}

			// Assert the status code
			if rr.Code != tc.expectedCode {
				t.Errorf("Expected status %d, got %d for %s %s", tc.expectedCode, rr.Code, tc.method, tc.path)
			}
		})
	}
}

package middleware_test

import (
	"main/middleware"
	"main/service"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
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

func TestAuthenticateMeber(t *testing.T) {
	// Generate a valid token
	validToken := GenerateTestToken(123, service.SecretKey, time.Now().Add(time.Hour))
	// Generate an expired token
	expiredToken := GenerateTestToken(123, service.SecretKey, time.Now().Add(-time.Hour))
	// Invalid token
	invalidToken := "invalid.token.structure"

	// Mock handler to capture the context value
	mockHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		meberID, ok := r.Context().Value(middleware.MeberIDKey).(int64)
		if !ok {
			t.Error("Expected meber ID in context, but got none")
		}
		if meberID != 123 {
			t.Errorf("Expected meber ID 123, got %d", meberID)
		}
		w.WriteHeader(http.StatusOK)
	})

	// Wrap the mock handler with the middleware
	handler := middleware.AuthenticateMeber(mockHandler)

	// Define test cases
	tests := []struct {
		name         string
		authHeader   string
		expectedCode int
	}{
		{
			name:         "Valid Token",
			authHeader:   "Bearer " + validToken,
			expectedCode: http.StatusOK,
		},
		{
			name:         "Expired Token",
			authHeader:   "Bearer " + expiredToken,
			expectedCode: http.StatusUnauthorized,
		},
		{
			name:         "Invalid Token",
			authHeader:   "Bearer " + invalidToken,
			expectedCode: http.StatusUnauthorized,
		},
		{
			name:         "Missing Authorization Header",
			authHeader:   "",
			expectedCode: http.StatusUnauthorized,
		},
		{
			name:         "Invalid Authorization Header Format",
			authHeader:   "InvalidHeaderFormat",
			expectedCode: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a new HTTP request
			req := httptest.NewRequest("GET", "/protected-endpoint", nil)
			req.Header.Set("Authorization", tt.authHeader)

			// Record the response
			rr := httptest.NewRecorder()

			// Serve the request
			handler.ServeHTTP(rr, req)

			// Assert the status code
			if rr.Code != tt.expectedCode {
				t.Errorf("Expected status code %d, got %d", tt.expectedCode, rr.Code)
			}
		})
	}
}

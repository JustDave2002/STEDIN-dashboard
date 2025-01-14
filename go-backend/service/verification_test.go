package service_test

import (
	"main/service"
	"testing"
	"time"

	"github.com/dgrijalva/jwt-go"
)

func TestVerifyToken(t *testing.T) {
	// Helper function to generate tokens
	generateToken := func(meberID int64, secret []byte, exp time.Time) string {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"meber_id": meberID,
			"exp":      exp.Unix(),
		})
		tokenString, _ := token.SignedString(secret)
		return tokenString
	}

	// Test cases
	tests := []struct {
		name      string
		token     string
		expectID  int64
		expectErr bool
	}{
		{
			name:      "Valid Token",
			token:     generateToken(123, service.SecretKey, time.Now().Add(time.Hour)),
			expectID:  123,
			expectErr: false,
		},
		{
			name:      "Expired Token",
			token:     generateToken(456, service.SecretKey, time.Now().Add(-time.Hour)),
			expectID:  0,
			expectErr: true,
		},
		{
			name:      "Invalid Signing Key",
			token:     generateToken(789, []byte("invalid_secret"), time.Now().Add(time.Hour)),
			expectID:  0,
			expectErr: true,
		},
		{
			name: "Missing Claims",
			token: func() string {
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{})
				tokenString, err := token.SignedString(service.SecretKey)
				if err != nil {
					t.Fatalf("Failed to create token for Missing Claims test: %v", err)
				}
				return tokenString
			}(),
			expectID:  0,
			expectErr: true,
		},
		{
			name:      "Invalid Token Format",
			token:     "not_a_valid_token",
			expectID:  0,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Act
			meberID, err := service.VerifyToken(tt.token)

			// Assert
			if (err != nil) != tt.expectErr {
				t.Errorf("Expected error: %v, got: %v", tt.expectErr, err)
			}
			if meberID != tt.expectID {
				t.Errorf("Expected meber ID: %d, got: %d", tt.expectID, meberID)
			}
		})
	}
}

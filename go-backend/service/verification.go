package service

import (
	"errors"
	"fmt"
	"github.com/dgrijalva/jwt-go"
)

var SecretKey = []byte("your_secret_key") // Totally secure btw

// VerifyToken verifies the JWT token and extracts the meber ID
func VerifyToken(tokenString string) (int64, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is correct
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return SecretKey, nil
	})

	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	// Extract claims from the token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}

	// Extract user ID from claims
	meberIDFloat, ok := claims["user_id"].(float64) // this HAS to be user_id sadly
	if !ok {
		return 0, errors.New("meber ID not found in token")
	}
	meberID := int64(meberIDFloat)

	return meberID, nil
}

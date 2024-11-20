package service

import (
	"errors"
	"fmt"
	"github.com/dgrijalva/jwt-go"
)

var secretKey = []byte("your_secret_key")

// VerifyToken verifies the JWT token and extracts the user ID
func VerifyToken(tokenString string) (int64, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is correct
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
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
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, errors.New("user ID not found in token")
	}
	userID := int64(userIDFloat)

	return userID, nil
}
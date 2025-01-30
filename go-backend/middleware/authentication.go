package middleware

import (
	"context"
	"main/service"
	"net/http"
	"strings"
)

type key string

const MeberIDKey key = "meberID"

// AuthenticateMeber verifies the JWT token and adds the meber ID to the request context
func AuthenticateMeber(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Step 1: Get the Authorization Header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		// Step 2: Extract the Bearer token
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}
		token := tokenParts[1]

		// Step 3: Verify the token and extract meber ID
		meberID, err := service.VerifyToken(token)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Step 4: Add the user ID to the request context
		ctx := context.WithValue(r.Context(), MeberIDKey, meberID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

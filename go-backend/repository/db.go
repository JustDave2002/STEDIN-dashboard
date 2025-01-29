package repository

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var DB *sql.DB

func InitDB(relativePath string) {
	envFile := ".env.development" // Default for local development

	// Check if running in Docker (using an environment variable set in Dockerfile)
	if os.Getenv("APP_ENV") == "docker" {
		envFile = ".env.docker"
	}

	// Allow overriding with a function argument
	if relativePath != "" {
		envFile = relativePath
	}

	err := godotenv.Load(envFile)
	if err != nil {
		log.Fatalf("Error loading .env.development file from path '%s': %v", envFile, err)
	}
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("MYSQL_ROOT_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("MYSQL_DATABASE")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPassword, dbHost, dbPort, dbName)
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Error pinging the database: %v", err)
	}

	log.Println("Database connection successfully established")
}

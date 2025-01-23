package main

import (
	"database/sql"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"k8s.io/client-go/tools/clientcmd"
	"log"
	"main/k8s"
	"os"
	"path/filepath"
)

var DB *sql.DB

func main() {
	initDB()

	// Setup Kubernetes connection
	k8s.Setupk8s()

	// Load kubeconfig
	kubeconfig := filepath.Join("/mnt/c/Users/lucag/.kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		panic(fmt.Errorf("failed to load kubeconfig: %v", err))
	}

	// Initialize Kubernetes client
	err = k8s.InitK8sClient(config)
	if err != nil {
		panic(fmt.Errorf("failed to initialize Kubernetes client: %v", err))
	}

	// Create namespace
	err = k8s.CreateNamespace(k8s.Ctx, "edge-devices")
	if err != nil {
		fmt.Errorf("failed to create namespace: %v", err)
	}

	// Deploy edge devices
	devices := []struct {
		Name     string
		DeviceID int64
	}{
		{"MSR_5065", 4971},
		{"MSR_8977", 8973},
	}

	for _, device := range devices {
		url, err := k8s.DeployEdgeDevice(k8s.Ctx, "edge-devices", device.Name, device.DeviceID)
		if err != nil {
			panic(fmt.Errorf("failed to deploy edge device %s: %v", device.Name, err))
		}

		// Save the URL to the database
		query := `UPDATE edge_devices SET ip_address = ? WHERE name = ?`
		_, err = DB.Exec(query, url, device.Name)
		if err != nil {
			panic(fmt.Errorf("failed to update device URL in database for %s: %v", device.Name, err))
		}
	}

	// List all edge devices
	devicesList, err := k8s.ListEdgeDevices(k8s.Ctx, "edge-devices")
	if err != nil {
		panic(fmt.Errorf("failed to list edge devices: %v", err))
	}

	for _, device := range devicesList {
		fmt.Printf("Edge Device: %s, Status: %s\n", device.Name, device.Status.Phase)
	}
}

func initDB() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
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

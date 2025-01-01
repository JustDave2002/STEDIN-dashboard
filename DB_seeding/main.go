package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/go-faker/faker/v4"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

const (
	numDevices          = 2000
	numApplications     = 4
	seedFilePath        = "seed.sql"
	maxWorkers          = 50
	errorRatePercent    = 0.2 // 0.1% error rate for edge devices
	appIssueRatePercent = 0.1 // 0.1% app issue rate
)

var municipalities []string

func main() {
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
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		fmt.Println("Error connecting to the database:", err)
		return
	}
	defer db.Close()

	fmt.Println("Connected to the database successfully!")
	rand.Seed(time.Now().UnixNano())

	// Load GeoJSON data
	LoadMunicipalityGeojson("StedinGeojson.jsx")

	// Print all municipalities names
	municipalities = getMunicipalityNames()
	for _, name := range municipalities {
		fmt.Println("Gemeente:", name)
	}

	err = resetDatabase(db)
	if err != nil {
		log.Fatalf("Error emptying database: %v", err)
	}
	err = executeSQLFile(db)
	if err != nil {
		log.Fatalf("Error reseeding database: %v", err)
	}

	SeedMunicipalityData(db, municipalities)

	concurrentSeeder(db, 0, numDevices)
	log.Println("Finished seeding edge devices")
}

func concurrentSeeder(db *sql.DB, function int, iterations int) {
	var wg sync.WaitGroup // WaitGroup to manage Goroutines

	// Create a buffered channel to control concurrency (maxWorkers)
	workerChannel := make(chan struct{}, maxWorkers)

	for i := 1; i <= iterations; i++ {
		wg.Add(1)

		// Launch a Goroutine for each seeding task
		go func(index int) {
			defer wg.Done()

			// Block if there are already `maxWorkers` workers
			workerChannel <- struct{}{}

			// Print sending request
			// fmt.Printf("Worker doing things")

			if function == 0 {
				seedEdgeDevice(db, i)
				fmt.Println("Finished seeding device ", i)
			}

			<-workerChannel // Release the worker
		}(i)
	}

	wg.Wait() // Wait for all Goroutines to complete
	println("Finished concurrency")
}

// Function to empty all tables and execute seed.sql
func resetDatabase(db *sql.DB) error {
	// Define tables to truncate in dependency order
	tables := []string{
		"application_instances", "application_sensors", "applications", "device_sensors",
		"device_tags", "edge_devices", "logs", "meber_applications", "meber_roles",
		"mebers", "role_tags", "roles", "sensors", "tags",
	}

	// Temporarily disable foreign key checks
	_, err := db.Exec("SET FOREIGN_KEY_CHECKS=0")
	if err != nil {
		return fmt.Errorf("error disabling foreign key checks: %v", err)
	}

	// Truncate each table
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s", table))
		if err != nil {
			return fmt.Errorf("error truncating table %s: %v", table, err)
		}
	}

	// Re-enable foreign key checks
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS=1")
	if err != nil {
		return fmt.Errorf("error enabling foreign key checks: %v", err)
	}

	return nil
}

// executeSQLFile reads and executes the SQL statements from a file
func executeSQLFile(db *sql.DB) error {
	// Read the SQL file
	content, err := ioutil.ReadFile(seedFilePath)
	if err != nil {
		return fmt.Errorf("failed to read SQL file: %w", err)
	}

	// Split the content into individual SQL statements
	commands := strings.Split(string(content), ";")
	for _, command := range commands {
		command = strings.TrimSpace(command)
		if command == "" {
			continue // Skip empty commands
		}

		// Execute each SQL statement
		if _, err := db.Exec(command); err != nil {
			log.Printf("failed to execute command: %s, error: %v", command, err)
		} else {
			log.Printf("executed command: %s", command)
		}
	}

	return nil
}

func seedEdgeDevice(db *sql.DB, index int) {
	name := "MSR" + "_" + fmt.Sprint(index)
	status := weightedStatus() // This could return 'offline', 'error', 'app_issue', or 'online'
	connectionType := randomConnectionType()
	municipality := municipalities[rand.Intn(len(municipalities))]
	coordinates := randomCoordinatesWithinMunicipality(municipality)
	ipAddress := faker.IPv4()
	performanceMetric := randomPerformanceMetric(status)
	lastContact := randomTimestamp()

	// Insert device into the database
	query := `INSERT INTO edge_devices (name, status, last_contact, connection_type, coordinates, ip_address, performance_metric)
              VALUES (?, ?, ?, ?, POINT(?, ?), ?, ?)`
	res, err := db.Exec(query, name, status, lastContact, connectionType, coordinates.lon, coordinates.lat, ipAddress, performanceMetric)
	if err != nil {
		log.Printf("Error inserting edge device %d: %v\n", index, err)
		return
	}

	// Get the device ID
	deviceID, err := res.LastInsertId()
	if err != nil {
		log.Printf("Error fetching last insert id for edge device %d: %v\n", index, err)
		return
	}

	// Seed tags and sensors for the device
	seedDeviceTag(db, deviceID, municipality)
	seedDeviceSensorsAndApplications(db, deviceID, status)

	// Generate a log if the status is either "offline", "error", or "app_issue"
	if status == "offline" || status == "error" {
		log.Printf("Generate device log for status: %s", status)
		// Create a log for this device since it's in a non-'online' status (offline, error, or app_issue)
		seedLogForDevice(db, deviceID, status, lastContact) // Pass lastContact as timestamp
	}
}

func weightedStatus() string {
	// Use static percentages to calculate device states
	onlineRate := 100 - errorRatePercent
	offlineRate := errorRatePercent * 0.3 // Adjust offline proportion
	errorRate := errorRatePercent * 0.7   // Adjust error proportion

	r := rand.Float64() * 100
	switch {
	case r < onlineRate:
		return "online"
	case r < onlineRate+offlineRate:
		return "offline"
	case r < onlineRate+offlineRate+errorRate:
		return "error"
	default:
		return "online" // Fallback (should never occur due to rates adding to 100)
	}
}

func applicationStatusForDevice(deviceStatus string) string {
	// Keep application errors within the appIssueRatePercent threshold
	if deviceStatus == "offline" {
		return "offline"
	}
	if rand.Float64()*100 < appIssueRatePercent {
		return "error"
	}
	return "online"
	//TODO: add warning
}

func randomPerformanceMetric(status string) float64 {
	if status == "offline" {
		return 0.0
	}
	return rand.Float64() * 100
}

func seedDeviceTag(db *sql.DB, deviceID int64, tagName string) {
	query := `INSERT INTO device_tags (device_id, tag_id) SELECT ?, id FROM tags WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, tagName)
	if err != nil {
		log.Printf("Error inserting device tag %s for device %d: %v\n", tagName, deviceID, err)
	}
}

func seedDeviceSensorsAndApplications(db *sql.DB, deviceID int64, deviceStatus string) {
	requiredSensors := map[string][]string{
		"Fraude Detectie":        {"spanningssensor"},
		"Straatlampen App":       {"straatlampen"},
		"temperatuur monitoring": {"spanningssensor", "temperatuursensor"},
		"Audio Analysis":         {"audio sensor"},
	}

	numApps := rand.Intn(2) + 1
	selectedApps := randomApplications(numApps)

	for _, appName := range selectedApps {
		neededSensors := requiredSensors[appName]

		if appName == "Fraude Detectie" {
			seedDeviceTag(db, deviceID, "fraude")
		}
		for _, sensor := range neededSensors {
			seedDeviceSensor(db, deviceID, sensor)
		}

		appStatus := applicationStatusForDevice(deviceStatus)
		// Seed the application instance and capture the appInstanceID
		appInstanceID := seedApplicationInstance(db, deviceID, appName, appStatus, fmt.Sprintf("/path/to/%s", appName))

		// Generate log if the app status is "error" or "app_issue"
		if appStatus == "error" || appStatus == "app_issue" || appStatus == "offline" {
			seedLogForApplication(db, deviceID, appInstanceID, appStatus) // Correctly use the appInstanceID
		}

		// If the device has a status issue, update the edge device status to 'app_issue' and create logs
		if appStatus == "error" {
			_, err := db.Exec(`UPDATE edge_devices SET status = 'app_issue' WHERE id = ?`, deviceID)
			if err != nil {
				log.Printf("Error updating edge device status to 'app_issue' for device %d: %v\n", deviceID, err)
			}
		}
	}
}

func randomApplications(numApps int) []string {
	allApps := []string{"Fraude Detectie", "Straatlampen App", "temperatuur monitoring", "Audio Analysis"}
	rand.Shuffle(len(allApps), func(i, j int) { allApps[i], allApps[j] = allApps[j], allApps[i] })
	return allApps[:numApps]
}

func seedDeviceSensor(db *sql.DB, deviceID int64, sensorName string) {
	query := `INSERT INTO device_sensors (sensor_id, device_id) SELECT id, ? FROM sensors WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, sensorName)
	if err != nil {
		log.Printf("Error inserting sensor %s for device %d: %v\n", sensorName, deviceID, err)
	}
}

func seedApplicationInstance(db *sql.DB, deviceID int64, appName string, status string, path string) int64 {
	query := `INSERT INTO application_instances (app_id, device_id, status, path) 
              SELECT id, ?, ?, ? FROM applications WHERE name = ? LIMIT 1`

	result, err := db.Exec(query, deviceID, status, path, appName)
	if err != nil {
		log.Printf("Error inserting application instance %s for device %d: %v\n", appName, deviceID, err)
	}

	// Return the application instance ID (last inserted ID)
	appInstanceID, _ := result.LastInsertId()
	return appInstanceID
}

func seedLogForDevice(db *sql.DB, deviceID int64, status string, lastContact time.Time) {
	// Only generate logs for non-"online" statuses
	if status == "online" {
		return
	}

	// Retrieve the device name from the database
	var deviceName string
	err := db.QueryRow(`SELECT name FROM edge_devices WHERE id = ?`, deviceID).Scan(&deviceName)
	if err != nil {
		log.Printf("Error fetching device name for device ID %d: %v\n", deviceID, err)
		return
	}

	// Generate the log message using the device name
	logMessage := fmt.Sprintf("Device '%s' is in %s status", deviceName, status)

	// Ensure the log timestamp is after the last_contact time
	logTimestamp := lastContact.Add(time.Minute) // Add a minute to ensure it's after last_contact

	// Insert a log for the device into the logs table
	query := `INSERT INTO logs (device_id, description, warning_level, timestamp) 
              VALUES (?, ?, ?, ?)`
	_, err = db.Exec(query, deviceID, logMessage, status, logTimestamp)
	if err != nil {
		log.Printf("Error inserting log for device %d: %v\n", deviceID, err)
	}
}

func seedLogForApplication(db *sql.DB, deviceID int64, appInstanceID int64, status string) {
	// Only generate logs for non-"online" statuses
	if status == "online" {
		return
	}

	// Retrieve the device name from the database
	var deviceName string
	err := db.QueryRow(`SELECT name FROM edge_devices WHERE id = ?`, deviceID).Scan(&deviceName)
	if err != nil {
		log.Printf("Error fetching device name for device ID %d: %v\n", deviceID, err)
		return
	}

	// Retrieve the application name for the instance
	var appName string
	err = db.QueryRow(`SELECT name FROM applications WHERE id = (SELECT app_id FROM application_instances WHERE id = ?)`, appInstanceID).Scan(&appName)
	if err != nil {
		log.Printf("Error fetching application name for application instance ID %d: %v\n", appInstanceID, err)
		return
	}

	// Generate the log message using the app name, device name, and status
	logMessage := fmt.Sprintf("%s application instance %d on device '%s' has an issue with status %s", appName, appInstanceID, deviceName, status)
	logTimestamp := randomTimestamp() // A function to generate a random timestamp

	// Insert a log for the application into the logs table, including the device_id
	query := `INSERT INTO logs (device_id, app_instance_id, description, warning_level, timestamp) 
              VALUES (?, ?, ?, ?, ?)`
	_, err = db.Exec(query, deviceID, appInstanceID, logMessage, status, logTimestamp)
	if err != nil {
		log.Printf("Error inserting log for application %d on device %d: %v\n", appInstanceID, deviceID, err)
	}
}

func randomConnectionType() string {
	types := []string{"wired", "wireless"}
	return types[rand.Intn(len(types))]
}

func randomTimestamp() time.Time {
	now := time.Now()
	past := now.AddDate(-2, 0, 0)
	randomDuration := time.Duration(rand.Int63n(int64(now.Sub(past))))
	return past.Add(randomDuration)
}

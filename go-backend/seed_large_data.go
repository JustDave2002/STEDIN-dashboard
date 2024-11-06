package main

import (
	"database/sql"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/go-faker/faker/v4"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

const (
	numDevices      = 10
	numRoles        = 7 // 1 admin, 1 team fraude, and 5 gemeenten
	numGemeentes    = 5 // Number of gemeenten for tag/location assignment
	numApplications = 4 // Number of applications
	numSensors      = 4 // Defined sensors
)

var gemeenten = []string{"Middelburg", "Goes", "Reimerswaal", "Schouwen-Duiveland", "Hulst"}

func SeedData() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("MYSQL_ROOT_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("MYSQL_DATABASE")

	// Configure the database connection
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPassword, dbHost, dbPort, dbName)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		fmt.Println("Error connecting to the database:", err)
		return
	}
	defer db.Close()

	fmt.Println("Connected to the database successfully!")
	fmt.Println(dsn)
	rand.Seed(time.Now().UnixNano())

	// Seed edge devices and associated data
	for i := 0; i < numDevices; i++ {
		fmt.Println("seeding edge device")
		seedEdgeDevice(db, i)
	}
	log.Println("Finished seeding edge devices")

	// Seed logs
	for i := 0; i < 50; i++ { // example number of logs
		fmt.Println("seeding log")
		seedLog(db)
	}
	log.Println("Finished seeding logs")
}

func seedEdgeDevice(db *sql.DB, index int) {
	name := faker.Username() + "_" + fmt.Sprint(index)
	status := randomStatus()
	connectionType := randomConnectionType()
	coordinates := randomCoordinates()
	ipAddress := faker.IPv4()
	performanceMetric := randomPerformanceMetric()
	lastContact := randomTimestamp()
	gemeente := gemeenten[rand.Intn(numGemeentes)]

	query := `INSERT INTO edge_devices (name, status, last_contact, connection_type, coordinates, ip_address, performance_metric)
	VALUES (?, ?, ?, ?, POINT(?, ?), ?, ?)`

	res, err := db.Exec(query, name, status, lastContact, connectionType, coordinates.lat, coordinates.lon, ipAddress, performanceMetric)
	if err != nil {
		log.Printf("Error inserting edge device %d: %v\n", index, err)
		return
	}

	deviceID, err := res.LastInsertId()
	if err != nil {
		log.Printf("Error fetching last insert id for edge device %d: %v\n", index, err)
		return
	}

	// Assign gemeente tag to device
	seedDeviceTag(db, deviceID, gemeente)
	// Randomly assign some devices the "fraude" tag
	isTeamFraude := false
	if rand.Intn(100) < 1 { // Approx. 1% chance
		isTeamFraude = true
		seedDeviceTag(db, deviceID, "fraude")
	}

	// Assign sensors and applications based on tags
	seedDeviceSensorsAndApplications(db, deviceID, gemeente, status, isTeamFraude)
}

func seedDeviceTag(db *sql.DB, deviceID int64, tagName string) {
	query := `
	INSERT INTO device_tags (device_id, tag_id)
	SELECT ?, id FROM tags WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, tagName)
	if err != nil {
		log.Printf("Error inserting device tag %s for device %d: %v\n", tagName, deviceID, err)
	}
}

func seedDeviceSensorsAndApplications(db *sql.DB, deviceID int64, gemeente string, deviceStatus string, isTeamFraude bool) {
	// Assign basic sensors to the device
	numSensorsAssigned := rand.Intn(numSensors) + 1
	for i := 0; i < numSensorsAssigned; i++ {
		sensorID := rand.Intn(numSensors) + 1

		query := `INSERT INTO device_sensors (sensor_id, device_id) VALUES (?, ?)`
		_, err := db.Exec(query, sensorID, deviceID)
		if err != nil {
			log.Printf("Error inserting sensor for device %d: %v\n", deviceID, err)
		}
	}

	// Determine application status based on device status
	appStatus := applicationStatusForDevice(deviceStatus)

	// Seed application instances based on tags
	if isTeamFraude {
		// Assign "Fraude Detectie" app with "spanningssensor" for team fraude devices
		seedApplicationInstance(db, deviceID, "Fraude Detectie", appStatus, "/path/to/fraude")
		seedDeviceSensor(db, deviceID, "spanningssensor")
	}

	if gemeente != "" {
		// Assign "Straatlampen App" with "straatlampen" sensor for gemeente-tagged devices
		seedApplicationInstance(db, deviceID, "Straatlampen App", appStatus, "/path/to/straatlampen")
		seedDeviceSensor(db, deviceID, "straatlampen")
	}
}

func seedDeviceSensor(db *sql.DB, deviceID int64, sensorName string) {
	query := `
	INSERT INTO device_sensors (sensor_id, device_id)
	SELECT id, ? FROM sensors WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, sensorName)
	if err != nil {
		log.Printf("Error inserting sensor %s for device %d: %v\n", sensorName, deviceID, err)
	}
}

func seedApplicationInstance(db *sql.DB, deviceID int64, appName string, status string, path string) {
	query := `
	INSERT INTO application_instances (app_id, device_id, status, path)
	SELECT id, ?, ?, ? FROM applications WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, status, path, appName)
	if err != nil {
		log.Printf("Error inserting application instance %s for device %d: %v\n", appName, deviceID, err)
	}
}

func seedLog(db *sql.DB) {
	description := faker.Sentence()
	warningLevel := randomStatus()
	timestamp := randomTimestamp()

	query := `INSERT INTO logs (device_id, app_id, description, warning_level, timestamp) VALUES (?, ?, ?, ?, ?)`
	_, err := db.Exec(query, rand.Intn(numDevices)+1, sql.NullInt64{Int64: int64(rand.Intn(numApplications) + 1), Valid: true}, description, warningLevel, timestamp)
	if err != nil {
		log.Printf("Error inserting log: %v\n", err)
	}
}

func applicationStatusForDevice(deviceStatus string) string {
	switch deviceStatus {
	case "offline":
		return "offline"
	case "error":
		return "error"
	default:
		return randomStatus() // Can be online, error, or offline
	}
}

func randomStatus() string {
	statuses := []string{"online", "offline", "error"}
	return statuses[rand.Intn(len(statuses))]
}

func randomConnectionType() string {
	types := []string{"wired", "wireless"}
	return types[rand.Intn(len(types))]
}

func randomCoordinates() (coords struct{ lat, lon float64 }) {
	coords.lat = faker.Latitude()
	coords.lon = faker.Longitude()
	return
}

func randomPerformanceMetric() float64 {
	return rand.Float64() * 100 // Random performance score between 0 and 100
}

func randomTimestamp() time.Time {
	// Generate a random date within the last 2 years
	now := time.Now()
	past := now.AddDate(-2, 0, 0) // 2 years ago
	randomDuration := time.Duration(rand.Int63n(int64(now.Sub(past))))
	return past.Add(randomDuration)
}

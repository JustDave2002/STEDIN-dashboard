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
	numDevices      = 100
	numLogs         = 500
	numApplications = 4
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
		println("Gemeente:", name)
	}
	SeedMunicipalityData(db, municipalities)

	for i := 0; i < numDevices; i++ {
		seedEdgeDevice(db, i)
		fmt.Println("Finished seeding device ", i)
	}
	log.Println("Finished seeding edge devices")

	for i := 0; i < numLogs; i++ {
		seedLog(db)
		fmt.Println("Finished seeding log ", i)
	}
	log.Println("Finished seeding logs")
}

func seedEdgeDevice(db *sql.DB, index int) {
	name := faker.Username() + "_" + fmt.Sprint(index)
	status := weightedStatus()
	connectionType := randomConnectionType()
	municipality := municipalities[rand.Intn(len(municipalities))]
	coordinates := randomCoordinatesWithinMunicipality(municipality)
	ipAddress := faker.IPv4()
	performanceMetric := randomPerformanceMetric(status)
	lastContact := randomTimestamp()

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

	seedDeviceTag(db, deviceID, municipality)
	isTeamFraude := rand.Intn(100) < 5
	if isTeamFraude {
		seedDeviceTag(db, deviceID, "fraude")
	}

	seedDeviceSensorsAndApplications(db, deviceID, status)
}

func weightedStatus() string {
	r := rand.Intn(100)
	switch {
	case r < 90:
		return "online"
	case r < 95:
		return "offline"
	default:
		return "error"
	}
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

	numApps := rand.Intn(4) + 1
	selectedApps := randomApplications(numApps)

	for _, appName := range selectedApps {
		neededSensors := requiredSensors[appName]

		for _, sensor := range neededSensors {
			seedDeviceSensor(db, deviceID, sensor)
		}

		appStatus := applicationStatusForDevice(deviceStatus)
		seedApplicationInstance(db, deviceID, appName, appStatus, fmt.Sprintf("/path/to/%s", appName))

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

func seedApplicationInstance(db *sql.DB, deviceID int64, appName string, status string, path string) {
	query := `INSERT INTO application_instances (app_id, device_id, status, path) SELECT id, ?, ?, ? FROM applications WHERE name = ? LIMIT 1`

	_, err := db.Exec(query, deviceID, status, path, appName)
	if err != nil {
		log.Printf("Error inserting application instance %s for device %d: %v\n", appName, deviceID, err)
	}
}

func seedLog(db *sql.DB) {
	description := faker.Sentence()
	warningLevel := logStatus()
	timestamp := randomTimestamp()

	// Randomly decide if log relates to app instance or device
	var appInstanceID sql.NullInt64
	if rand.Intn(100) < 50 { // 50% chance it’s an application log
		appInstanceID.Int64 = int64(rand.Intn(numApplications) + 1)
		appInstanceID.Valid = true
	}

	query := `INSERT INTO logs (device_id, app_instance_id, description, warning_level, timestamp) VALUES (?, ?, ?, ?, ?)`
	_, err := db.Exec(query, rand.Intn(numDevices)+1, appInstanceID, description, warningLevel, timestamp)
	if err != nil {
		log.Printf("Error inserting log: %v\n", err)
	}
}

func logStatus() string {
	statuses := []string{"warning", "error", "app_issue"}
	return statuses[rand.Intn(len(statuses))]
}

func applicationStatusForDevice(deviceStatus string) string {
	if deviceStatus == "offline" {
		return "offline"
	}
	if rand.Intn(100) < 5 {
		return "error"
	}
	//TODO: add warning
	return "online"
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

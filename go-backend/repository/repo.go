package repository

import (
	"database/sql"
	"fmt"
	"log"
	"main/structs"
	"strings"
	"time"
)

func GetDeviceByID(deviceID int64) (structs.EdgeDevice, error) {
	query := `
        SELECT 
            id, 
            name, 
            status, 
            last_contact, 
            connection_type, 
            ST_X(coordinates) AS latitude, 
            ST_Y(coordinates) AS longitude, 
            ip_address, 
            performance_metric 
        FROM edge_devices
        WHERE id = ?
    `

	var device structs.EdgeDevice
	err := DB.QueryRow(query, deviceID).Scan(
		&device.ID,
		&device.Name,
		&device.Status,
		&device.LastContact,
		&device.ConnectionType,
		&device.Longitude,
		&device.Latitude,
		&device.IPAddress,
		&device.PerformanceMetric,
	)
	if err != nil {
		log.Printf("Error retrieving device: %v", err)
		return structs.EdgeDevice{}, err
	}

	return device, nil
}

func GetAllDevices() ([]structs.EdgeDevice, error) {
	query := `
        SELECT 
            id, 
            name, 
            status, 
            last_contact, 
            connection_type, 
            ST_X(coordinates) AS latitude, 
            ST_Y(coordinates) AS longitude, 
            ip_address, 
            performance_metric 
        FROM edge_devices
    `

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving devices: %v", err)
		return nil, err
	}
	defer rows.Close()

	var devices []structs.EdgeDevice
	for rows.Next() {
		var device structs.EdgeDevice
		var lastContactRaw []uint8

		err := rows.Scan(
			&device.ID,
			&device.Name,
			&device.Status,
			&lastContactRaw,
			&device.ConnectionType,
			&device.Longitude,
			&device.Latitude,
			&device.IPAddress,
			&device.PerformanceMetric,
		)
		if err != nil {
			log.Printf("Error scanning device: %v", err)
			return nil, err
		}

		// Convert the []uint8 lastContactRaw to time.Time
		lastContactString := string(lastContactRaw)
		lastContactTime, err := time.Parse("2006-01-02 15:04:05", lastContactString)
		if err != nil {
			log.Printf("Error parsing last_contact timestamp: %v", err)
			return nil, err
		}
		device.LastContact = lastContactTime

		devices = append(devices, device)
	}

	return devices, nil
}

// TODO: Fix the lat long for the love of anything sane
func GetAllDevicesForMap(meberID int64) ([]structs.EdgeDeviceMapResponse, error) {
	// Define the base query (without the WHERE clause)
	baseQuery := `
		SELECT 
			ed.id, 
			ed.name, 
			ed.status, 
			ed.last_contact, 
			ed.connection_type, 
			ST_X(ed.coordinates) AS latitude, 
			ST_Y(ed.coordinates) AS longitude, 
			ed.ip_address, 
			ed.performance_metric, 
			tg.name AS municipality
		FROM edge_devices ed
		LEFT JOIN device_tags dt ON ed.id = dt.device_id
		LEFT JOIN tags tg ON dt.tag_id = tg.id
	`

	// Get the query with the necessary RBAC applied
	query, err := applyRoleBasedAccess(meberID, baseQuery)
	if err != nil {
		return nil, fmt.Errorf("error applying role-based access: %w", err)
	}

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving devices for map: %v", err)
		return nil, err
	}
	defer rows.Close()

	var devices []structs.EdgeDeviceMapResponse
	for rows.Next() {
		var device structs.EdgeDevice
		var lastContactRaw []uint8
		var municipality sql.NullString

		err := rows.Scan(
			&device.ID,
			&device.Name,
			&device.Status,
			&lastContactRaw,
			&device.ConnectionType,
			&device.Longitude,
			&device.Latitude,
			&device.IPAddress,
			&device.PerformanceMetric,
			&municipality,
		)
		if err != nil {
			log.Printf("Error scanning device: %v", err)
			return nil, err
		}

		// Convert the []uint8 lastContactRaw to time.Time
		lastContactString := string(lastContactRaw)
		lastContactTime, err := time.Parse("2006-01-02 15:04:05", lastContactString)
		if err != nil {
			log.Printf("Error parsing last_contact timestamp: %v", err)
			return nil, err
		}
		device.LastContact = lastContactTime

		// Set municipality if it is valid
		var municipalityName string
		if municipality.Valid {
			municipalityName = municipality.String
		}

		// Create response struct and append it to devices list
		mapResponse := structs.EdgeDeviceMapResponse{
			ID:           device.ID,
			Name:         device.Name,
			Status:       device.Status,
			Municipality: municipalityName,
			Latitude:     device.Latitude,
			Longitude:    device.Longitude,
		}
		devices = append(devices, mapResponse)
	}

	return devices, nil
}

// GetApplicationInstancesByDeviceID retrieves application instance details for a specific device
func GetApplicationInstancesByDeviceID(deviceID int64) ([]structs.ApplicationInstanceDTO, error) {
	query := `
        SELECT 
            ai.id AS INSTANCEID, 
            a.name, 
            ai.status, 
            ai.path, 
            a.description, 
            a.version
        FROM 
            application_instances ai
        JOIN 
            applications a 
        ON 
            ai.app_id = a.id
        WHERE 
            ai.device_id = ?
    `

	rows, err := DB.Query(query, deviceID)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return nil, err
	}
	defer rows.Close()

	var apps []structs.ApplicationInstanceDTO
	for rows.Next() {
		var app structs.ApplicationInstanceDTO
		if err := rows.Scan(&app.InstanceID, &app.Name, &app.Status, &app.Path, &app.Description, &app.Version); err != nil {
			log.Printf("Error scanning row: %v", err)
			return nil, err
		}
		apps = append(apps, app)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error while iterating rows: %v", err)
		return nil, err
	}

	if len(apps) == 0 {
		log.Printf("No application instances found for deviceID: %d", deviceID)
	}

	return apps, nil
}

// Fetches all devices and their associated applications from the database
var GetAllDevicesWithApplications = func(meberID int64) ([]struct {
	DeviceID             int64
	DeviceName           string
	DeviceStatus         string
	DeviceLastContact    string
	DeviceConnectionType string
	Longitude            float64
	Latitude             float64
	DeviceIPAddress      string
	InstanceID           int64
	AppName              string
	AppStatus            string
	AppPath              string
	AppDescription       string
	AppVersion           string
	TagID                *int64
	TagName              *string
	TagType              *string
	TagIsEditable        *bool
	TagOwnerID           *int64
}, error) {
	baseQuery := `
        SELECT 
            d.id AS device_id, 
            d.name AS device_name, 
            d.status AS device_status, 
            d.last_contact AS device_last_contact, 
            d.connection_type AS device_connection_type, 
            ST_X(d.coordinates) AS longitude, 
            ST_Y(d.coordinates) AS latitude, 
            d.ip_address AS device_ip_address,
            ai.id AS instance_id, 
            a.name AS app_name, 
            ai.status AS app_status, 
            ai.path AS app_path, 
            a.description AS app_description, 
            a.version AS app_version,
            tg.id AS tag_id,
            tg.name AS tag_name,
            tg.type AS tag_type,
            tg.is_editable AS tag_is_editable,
            tg.owner_id AS tag_owner_id
        FROM 
            edge_devices d
        LEFT JOIN 
            application_instances ai 
        ON 
            d.id = ai.device_id
        LEFT JOIN 
            applications a 
        ON 
            ai.app_id = a.id
        LEFT JOIN 
            device_tags dt 
        ON 
            d.id = dt.device_id
        LEFT JOIN 
            tags tg 
        ON 
            dt.tag_id = tg.id
        ORDER BY d.id
    `

	query, err := applyRoleBasedAccess(meberID, baseQuery)
	if err != nil {
		return nil, fmt.Errorf("error applying role-based access: %w", err)
	}

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return nil, err
	}
	defer rows.Close()

	// Slice to hold the raw results
	var rawResults []struct {
		DeviceID             int64
		DeviceName           string
		DeviceStatus         string
		DeviceLastContact    string
		DeviceConnectionType string
		Longitude            float64
		Latitude             float64
		DeviceIPAddress      string
		InstanceID           int64
		AppName              string
		AppStatus            string
		AppPath              string
		AppDescription       string
		AppVersion           string
		TagID                *int64
		TagName              *string
		TagType              *string
		TagIsEditable        *bool
		TagOwnerID           *int64
	}

	// Fetch and scan rows
	for rows.Next() {
		var result struct {
			DeviceID             int64
			DeviceName           string
			DeviceStatus         string
			DeviceLastContact    string
			DeviceConnectionType string
			Longitude            float64
			Latitude             float64
			DeviceIPAddress      string
			InstanceID           int64
			AppName              string
			AppStatus            string
			AppPath              string
			AppDescription       string
			AppVersion           string
			TagID                *int64
			TagName              *string
			TagType              *string
			TagIsEditable        *bool
			TagOwnerID           *int64
		}

		err := rows.Scan(&result.DeviceID, &result.DeviceName, &result.DeviceStatus, &result.DeviceLastContact,
			&result.DeviceConnectionType, &result.Longitude, &result.Latitude, &result.DeviceIPAddress,
			&result.InstanceID, &result.AppName, &result.AppStatus, &result.AppPath, &result.AppDescription, &result.AppVersion,
			&result.TagID, &result.TagName, &result.TagType, &result.TagIsEditable, &result.TagOwnerID)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			return nil, err
		}

		rawResults = append(rawResults, result)
	}

	return rawResults, nil
}

func GetMeberTags(meberID int64) ([]string, error) {
	query := `
		SELECT DISTINCT tg.name
		FROM meber_roles mr
		JOIN role_tags rt ON mr.role_id = rt.role_id
		JOIN tags tg ON rt.tag_id = tg.id
		WHERE mr.meber_id = ?
	`

	rows, err := DB.Query(query, meberID)
	if err != nil {
		log.Printf("Error retrieving user tags: %v", err)
		return nil, err
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			log.Printf("Error scanning tag: %v", err)
			return nil, err
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// GetAllMebers retrieves all mebers from the database
var GetAllMebers = func() ([]structs.Meber, error) {
	query := `SELECT m.id, m.name, r.id AS role_id, r.name AS role_name FROM mebers m LEFT JOIN meber_roles mr ON m.id = mr.meber_id LEFT JOIN roles r ON mr.role_id = r.id`

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving mebers: %v", err)
		return nil, err
	}
	defer rows.Close()

	var mebers []structs.Meber
	for rows.Next() {
		var meber structs.Meber
		var role structs.Role
		err := rows.Scan(&meber.ID, &meber.Name, &role.ID, &role.Name)
		if err != nil {
			log.Printf("Error scanning meber: %v", err)
			return nil, err
		}
		meber.Roles = append(meber.Roles, role)
		if err != nil {
			log.Printf("Error scanning meber: %v", err)
			return nil, err
		}
		mebers = append(mebers, meber)
	}

	return mebers, nil
}

// GetMeberByID retrieves a meber from the database by ID
var GetMeberByID = func(meberID int64) (*structs.Meber, error) {
	query := "SELECT id, name FROM mebers WHERE id = ?"
	row := DB.QueryRow(query, meberID)

	var meber structs.Meber
	err := row.Scan(&meber.ID, &meber.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		log.Printf("Error retrieving meber by ID: %v", err)
		return nil, err
	}

	return &meber, nil
}

func GetRolesForMeber(meberID int64) ([]structs.Role, error) {
	query := `
		SELECT r.id, r.name, r.is_restricted
		FROM meber_roles mr
		JOIN roles r ON mr.role_id = r.id
		WHERE mr.meber_id = ?
	`

	rows, err := DB.Query(query, meberID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving roles for meber: %w", err)
	}
	defer rows.Close()

	var roles []structs.Role
	for rows.Next() {
		var role structs.Role
		err := rows.Scan(&role.ID, &role.Name, &role.IsRestricted)
		if err != nil {
			return nil, fmt.Errorf("error scanning role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, nil
}

// GetAppStoreData retrieves all applications and associated sensor requirements
func GetAppStoreData() ([]structs.ApplicationWithSensors, error) {
	query := `
		SELECT a.id, a.name, a.description, s.id AS sensor_id, s.name AS sensor_name
		FROM applications a
		LEFT JOIN application_sensors aps ON a.id = aps.application_id
		LEFT JOIN sensors s ON aps.sensor_id = s.id
	`

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving app store data: %v", err)
		return nil, err
	}
	defer rows.Close()

	var applicationsMap = make(map[int64]structs.ApplicationWithSensors)
	for rows.Next() {
		var sensorID sql.NullInt64
		var sensorName sql.NullString
		var application structs.ApplicationWithSensors
		var sensor structs.Sensor

		err := rows.Scan(&application.ID, &application.Name, &application.Description, &sensorID, &sensorName)
		if err != nil {
			log.Printf("Error scanning app store data: %v", err)
			return nil, err
		}

		if app, exists := applicationsMap[application.ID]; exists {
			if sensorID.Valid && sensorName.Valid {
				sensor.ID = sensorID.Int64
				sensor.Name = sensorName.String
				app.Sensors = append(app.Sensors, sensor)
				applicationsMap[application.ID] = app
			}
		} else {
			if sensorID.Valid && sensorName.Valid {
				sensor.ID = sensorID.Int64
				sensor.Name = sensorName.String
				application.Sensors = append(application.Sensors, sensor)
			}
			applicationsMap[application.ID] = application
		}
	}

	var applications []structs.ApplicationWithSensors
	for _, app := range applicationsMap {
		applications = append(applications, app)
	}

	return applications, nil
}

// GetDevicesByMeber retrieves devices that a meber has access to
func GetDevicesByMeber(meberID int64) ([]structs.EdgeDevice, error) {
	// Define the base query (without the WHERE clause)
	baseQuery := `
		SELECT ed.id, ed.name, ed.status, ed.last_contact, ed.connection_type, ST_X(ed.coordinates) AS latitude, ST_Y(ed.coordinates) AS longitude, ed.ip_address, ed.performance_metric, tg.name AS municipality
		FROM edge_devices ed
		LEFT JOIN device_tags dt ON ed.id = dt.device_id
		LEFT JOIN tags tg ON dt.tag_id = tg.id
	`

	// Apply role-based access control to the base query
	query, err := applyRoleBasedAccess(meberID, baseQuery)
	if err != nil {
		return nil, fmt.Errorf("error applying role-based access: %w", err)
	}

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving devices for meber %d: %v", meberID, err)
		return nil, err
	}
	defer rows.Close()

	var devices []structs.EdgeDevice
	for rows.Next() {
		var device structs.EdgeDevice
		var lastContactRaw []uint8
		var municipality sql.NullString

		err := rows.Scan(
			&device.ID,
			&device.Name,
			&device.Status,
			&lastContactRaw,
			&device.ConnectionType,
			&device.Latitude,
			&device.Longitude,
			&device.IPAddress,
			&device.PerformanceMetric,
			&municipality,
		)
		if err != nil {
			log.Printf("Error scanning device for meber %d: %v", meberID, err)
			return nil, err
		}

		// Convert lastContactRaw to time.Time
		lastContactString := string(lastContactRaw)
		lastContactTime, err := time.Parse("2006-01-02 15:04:05", lastContactString)
		if err != nil {
			log.Printf("Error parsing last_contact timestamp: %v", err)
			return nil, err
		}
		device.LastContact = lastContactTime

		// Set municipality if it is valid
		if municipality.Valid {
			device.Municipality = municipality.String
		}

		devices = append(devices, device)
	}

	return devices, nil
}

func CheckDevicesEligibilityBulk(deviceIDs []int64, appID int64) ([]structs.EligibleDevice, error) {
	if len(deviceIDs) == 0 {
		return nil, nil
	}

	// Step 1: Construct the IN clause for device IDs
	placeholders := make([]string, len(deviceIDs))
	args := make([]interface{}, len(deviceIDs)+1) // +1 for appID
	args[0] = appID

	for i, id := range deviceIDs {
		placeholders[i] = "?"
		args[i+1] = id
	}

	inClause := strings.Join(placeholders, ",")

	// Query for installed applications
	installedQuery := fmt.Sprintf(`
        SELECT device_id
        FROM application_instances
        WHERE app_id = ? AND device_id IN (%s)
    `, inClause)

	rows, err := DB.Query(installedQuery, args...)
	if err != nil {
		log.Printf("Error fetching installed applications for app %d: %v", appID, err)
		return nil, err
	}
	defer rows.Close()

	installedMap := make(map[int64]bool)
	for rows.Next() {
		var deviceID int64
		if err := rows.Scan(&deviceID); err != nil {
			return nil, err
		}
		installedMap[deviceID] = true
	}

	// Step 2: Fetch required sensors for the application
	requiredSensorsQuery := `
        SELECT sensor_id
        FROM application_sensors
        WHERE application_id = ?
    `
	requiredRows, err := DB.Query(requiredSensorsQuery, appID)
	if err != nil {
		log.Printf("Error fetching required sensors for app %d: %v", appID, err)
		return nil, err
	}
	defer requiredRows.Close()

	requiredSensors := make(map[int64]bool)
	for requiredRows.Next() {
		var sensorID int64
		if err := requiredRows.Scan(&sensorID); err != nil {
			return nil, err
		}
		requiredSensors[sensorID] = true
	}

	// Step 3: Fetch device sensors
	deviceSensorsQuery := fmt.Sprintf(`
        SELECT device_id, sensor_id
        FROM device_sensors
        WHERE device_id IN (%s)
    `, inClause)

	rows, err = DB.Query(deviceSensorsQuery, args[1:]...) // Skip the first arg (appID)
	if err != nil {
		log.Printf("Error fetching device sensors: %v", err)
		return nil, err
	}
	defer rows.Close()

	deviceSensorMap := make(map[int64]map[int64]bool)
	for rows.Next() {
		var deviceID, sensorID int64
		if err := rows.Scan(&deviceID, &sensorID); err != nil {
			return nil, err
		}
		if _, exists := deviceSensorMap[deviceID]; !exists {
			deviceSensorMap[deviceID] = make(map[int64]bool)
		}
		deviceSensorMap[deviceID][sensorID] = true
	}

	// Step 4: Build the result list
	var eligibleDevices []structs.EligibleDevice
	for _, deviceID := range deviceIDs {
		installed := installedMap[deviceID]
		deviceSensors, hasSensors := deviceSensorMap[deviceID]

		// Determine if all required sensors are present
		hasAllSensors := true
		if len(requiredSensors) > 0 {
			if !hasSensors {
				hasAllSensors = false
			} else {
				for sensorID := range requiredSensors {
					if !deviceSensors[sensorID] {
						hasAllSensors = false
						break
					}
				}
			}
		}

		// Determine eligibility and reason
		eligible := !installed && hasAllSensors
		reason := "Device is eligible"
		if installed {
			reason = "Application already installed"
		} else if !hasAllSensors {
			reason = "Required sensors not present"
		}

		eligibleDevices = append(eligibleDevices, structs.EligibleDevice{
			Device:    "", // Set the device name in the service layer
			Eligible:  eligible,
			Installed: installed,
			Reason:    reason,
		})
	}

	return eligibleDevices, nil
}

func AddApplicationInstance(deviceID int64, appID int64) error {
	query := "INSERT INTO application_instances (device_id, app_id, status, path) VALUES (?, ?, 'warning', ?)"
	_, err := DB.Exec(query, deviceID, appID, "/path/to/newly created app")
	if err != nil {
		log.Printf("Error adding application instance for device %d and app %d: %v", deviceID, appID, err)
		return err
	}
	return nil
}

// FetchLogs retrieves logs based on the given parameters
func FetchLogs(deviceID, appInstanceID int64, startDate, endDate *time.Time) ([]structs.Log, error) {
	// Base query
	query := "SELECT id, device_id, app_instance_id, description, warning_level, timestamp FROM logs WHERE 1=1"

	// Add filters based on inputs
	args := []interface{}{}
	if deviceID != 0 {
		query += " AND device_id = ?"
		args = append(args, deviceID)
	}
	if appInstanceID != 0 {
		query += " AND app_instance_id = ?"
		args = append(args, appInstanceID)
	}
	if startDate != nil {
		query += " AND timestamp >= ?"
		args = append(args, *startDate)
	}
	if endDate != nil {
		query += " AND timestamp <= ?"
		args = append(args, *endDate)
	}

	// Execute the query
	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching logs: %w", err)
	}
	defer rows.Close()

	// Parse the rows into the logs slice
	var logs []structs.Log
	for rows.Next() {
		var log structs.Log
		var timestampRaw []byte // Handle timestamp column as []byte
		err := rows.Scan(&log.ID, &log.DeviceID, &log.AppInstanceID, &log.Description, &log.WarningLevel, &timestampRaw)
		if err != nil {
			return nil, fmt.Errorf("error scanning log row: %w", err)
		}

		// Convert timestampRaw to time.Time
		log.Timestamp, err = time.Parse("2006-01-02 15:04:05", string(timestampRaw))
		if err != nil {
			return nil, fmt.Errorf("error parsing timestamp: %w", err)
		}

		logs = append(logs, log)
	}

	// Check for row iteration errors
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating log rows: %w", err)
	}

	return logs, nil
}

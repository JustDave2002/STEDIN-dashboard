package repository

import (
	"database/sql"
	"log"
	"main/structs"
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
func GetAllDevicesForMap() ([]structs.EdgeDeviceMapResponse, error) {
	query := `
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
		WHERE tg.type = 'location'
	`

	rows, err := DB.Query(query)
	if err != nil {
		log.Printf("Error retrieving devices: %v", err)
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
func GetAllDevicesWithApplications() ([]struct {
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
	query := `
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
            t.id AS tag_id,
            t.name AS tag_name,
            t.type AS tag_type,
            t.is_editable AS tag_is_editable,
            t.owner_id AS tag_owner_id
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
            tags t 
        ON 
            dt.tag_id = t.id
        ORDER BY d.id;
    `

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

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

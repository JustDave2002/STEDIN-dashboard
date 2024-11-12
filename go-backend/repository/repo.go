package repository

import (
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
            ST_X(coordinates) AS longitude, 
            ST_Y(coordinates) AS latitude, 
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
            ST_X(coordinates) AS longitude, 
            ST_Y(coordinates) AS latitude, 
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

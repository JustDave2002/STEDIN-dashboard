package service

import (
	"log"
	"main/repository"
	"main/structs"
)

func GetEdgeDevice(deviceID int64) (structs.EdgeDevice, error) {
	return repository.GetDeviceByID(deviceID)
}

func GetAllEdgeDevices() ([]structs.EdgeDevice, error) {
	return repository.GetAllDevices()
}

func GetAllEdgeDevicesForMap() ([]structs.EdgeDeviceMapResponse, error) {
	return repository.GetAllDevicesForMap()
}

// GetAllDevicesWithApplications groups and converts data from the repository into DTO format
func GetAllDevicesWithApplications() ([]structs.DeviceWithApplicationsDTO, error) {
	// Fetch raw data from repository
	rawResults, err := repository.GetAllDevicesWithApplications()
	if err != nil {
		log.Printf("Error fetching devices and applications: %v", err)
		return nil, err
	}

	// A map to hold device IDs and their associated application instances
	deviceMap := make(map[int64]*structs.DeviceWithApplicationsDTO)

	// Iterate through the raw results and group applications by device
	for _, result := range rawResults {
		// If the device is not in the map, initialize its DTO
		if _, exists := deviceMap[result.DeviceID]; !exists {
			deviceMap[result.DeviceID] = &structs.DeviceWithApplicationsDTO{
				DeviceID:       result.DeviceID,
				Name:           result.DeviceName,
				Status:         result.DeviceStatus,
				LastContact:    result.DeviceLastContact,
				ConnectionType: result.DeviceConnectionType,
				Latitude:       result.Latitude,
				Longitude:      result.Longitude,
				IPAddress:      result.DeviceIPAddress,
				Applications:   []structs.ApplicationInstanceDTO{}, // Start with an empty slice
			}
		}

		// Now append the application instance to the correct device entry
		appDTO := structs.ApplicationInstanceDTO{
			InstanceID:  result.InstanceID,
			Name:        result.AppName,
			Status:      result.AppStatus,
			Path:        result.AppPath,
			Description: result.AppDescription,
			Version:     result.AppVersion,
		}
		deviceMap[result.DeviceID].Applications = append(deviceMap[result.DeviceID].Applications, appDTO)
	}

	// Convert the map to a slice for returning
	var devicesWithApps []structs.DeviceWithApplicationsDTO
	for _, deviceDTO := range deviceMap {
		devicesWithApps = append(devicesWithApps, *deviceDTO)
	}

	// Optionally, sort the slice by DeviceID or any other criteria if needed
	// For example, sorting by device ID:
	// sort.Slice(devicesWithApps, func(i, j int) bool {
	//     return devicesWithApps[i].DeviceID < devicesWithApps[j].DeviceID
	// })

	return devicesWithApps, nil
}

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

func GetAllEdgeDevicesForMap(userID int64) ([]structs.EdgeDeviceMapResponse, error) {
	// Get the user tags via RBAC
	userTags, err := repository.GetUserTags(userID)
	if err != nil {
		return nil, err
	}

	// If user has no tags, return empty
	if len(userTags) == 0 {
		return []structs.EdgeDeviceMapResponse{}, nil
	}

	// Call data layer to get devices filtered by user tags
	devices, err := repository.GetAllDevicesForMap(userTags)
	if err != nil {
		return nil, err
	}

	return devices, nil
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
				Applications:   []structs.ApplicationInstanceDTO{},
				Tags:           []structs.Tag{},
			}
		}

		// Add application data
		if result.InstanceID > 0 {
			appExists := false
			for _, app := range deviceMap[result.DeviceID].Applications {
				if app.InstanceID == result.InstanceID {
					appExists = true
					break
				}
			}
			if !appExists {
				deviceMap[result.DeviceID].Applications = append(deviceMap[result.DeviceID].Applications, structs.ApplicationInstanceDTO{
					InstanceID:  result.InstanceID,
					Name:        result.AppName,
					Status:      result.AppStatus,
					Path:        result.AppPath,
					Description: result.AppDescription,
					Version:     result.AppVersion,
				})
			}
		}

		// Add tag data
		if result.TagID != nil {
			tagExists := false
			for _, tag := range deviceMap[result.DeviceID].Tags {
				if tag.ID == *result.TagID {
					tagExists = true
					break
				}
			}
			if !tagExists {
				deviceMap[result.DeviceID].Tags = append(deviceMap[result.DeviceID].Tags, structs.Tag{
					ID:         *result.TagID,
					Name:       *result.TagName,
					Type:       *result.TagType,
					IsEditable: *result.TagIsEditable,
					OwnerID:    result.TagOwnerID,
				})
			}
		}
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

// GetAllMebers retrieves all mebers from the data layer
func GetAllMebers() ([]structs.Meber, error) {
	// Call data layer to get all mebers
	return repository.GetAllMebers()
}

// GetMeberByID retrieves a meber from the repository layer by ID
func GetMeberByID(meberID int64) (*structs.Meber, error) {
	return repository.GetMeberByID(meberID)
}

package service

import (
	"fmt"
	"log"
	"main/repository"
	"main/structs"
	"time"
)

//func GetEdgeDevice(deviceID int64) (structs.EdgeDevice, error) {
//	return repository.GetDeviceByID(deviceID)
//}
//
//func GetAllEdgeDevices() ([]structs.EdgeDevice, error) {
//	return repository.GetAllDevices()
//}

func GetAllEdgeDevicesForMap(meberID int64) ([]structs.EdgeDeviceMapResponse, error) {

	// Call data layer to get devices filtered by user tags
	devices, err := repository.GetAllDevicesForMap(meberID)
	if err != nil {
		return nil, err
	}

	return devices, nil
}

// GetAllDevicesWithApplications groups and converts data from the repository into DTO format
func GetAllDevicesWithApplications(meberID int64) ([]structs.DeviceWithApplicationsDTO, error) {
	// Fetch raw data from repository
	rawResults, err := repository.GetAllDevicesWithApplications(meberID)
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

func GetAppStoreData() ([]structs.ApplicationWithSensors, error) {
	return repository.GetAppStoreData()
}

// GetEligibleDevices retrieves devices eligible for installing the given application
func GetEligibleDevices(meberID int64, appID int64) ([]structs.EligibleDevice, error) {
	// Step 1: Get devices accessible by the user
	devices, err := repository.GetDevicesByMeber(meberID)
	if err != nil {
		return nil, err
	}

	// Extract device IDs and names
	var deviceIDs []int64
	deviceNameMap := make(map[int64]string)
	for _, device := range devices {
		deviceIDs = append(deviceIDs, device.ID)
		deviceNameMap[device.ID] = device.Name
	}

	// Step 2: Fetch eligibility data in bulk
	eligibilityData, err := repository.CheckDevicesEligibilityBulk(deviceIDs, appID)
	if err != nil {
		return nil, err
	}

	// Step 3: Map device names to the results
	for i := range eligibilityData {
		eligibilityData[i].Device = deviceNameMap[deviceIDs[i]]
	}

	return eligibilityData, nil
}

// AddApplicationsToDevices adds applications to the specified devices
func AddApplicationsToDevices(userID int64, appID int64, deviceIDs []int64) error {
	// Step 1: Verify that the user has access to the devices
	devices, err := repository.GetDevicesByMeber(userID)
	if err != nil {
		return err
	}

	deviceAccessMap := make(map[int64]bool)
	for _, device := range devices {
		deviceAccessMap[device.ID] = true
	}

	for _, deviceID := range deviceIDs {
		if !deviceAccessMap[deviceID] {
			return fmt.Errorf("user does not have access to device %d", deviceID)
		}
	}

	// Step 2: Add application instances to the devices
	for _, deviceID := range deviceIDs {
		err := repository.AddApplicationInstance(deviceID, appID)
		if err != nil {
			return fmt.Errorf("error adding application %d to device %d: %w", appID, deviceID, err)
		}
	}

	return nil
}

// GetLogs retrieves logs based on device ID and date range
func GetLogs(deviceID, appInstanceID int64, startDate, endDate *time.Time) ([]structs.Log, error) {
	// Delegate the database query to the repository layer
	logs, err := repository.FetchLogs(deviceID, appInstanceID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error fetching logs: %w", err)
	}

	return logs, nil
}

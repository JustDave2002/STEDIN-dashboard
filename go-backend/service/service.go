package service

import (
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

func GetAllDevicesWithApplications() ([]structs.DeviceWithApplicationsDTO, error) {
	devices, err := repository.GetAllDevices()
	if err != nil {
		return nil, err
	}

	var devicesWithApps []structs.DeviceWithApplicationsDTO

	for _, device := range devices {
		// Fetch application instances for the device
		apps, err := repository.GetApplicationInstancesByDeviceID(device.ID)
		if err != nil {
			return nil, err
		}

		// Populate the DeviceWithApplicationsDTO
		deviceDTO := structs.DeviceWithApplicationsDTO{
			DeviceID:       device.ID,
			Name:           device.Name,
			Status:         device.Status,
			LastContact:    device.LastContact.Format("2006-01-02 15:04:05"),
			ConnectionType: device.ConnectionType,
			Latitude:       device.Latitude,
			Longitude:      device.Longitude,
			IPAddress:      device.IPAddress,
			Applications:   apps,
		}

		devicesWithApps = append(devicesWithApps, deviceDTO)
	}

	return devicesWithApps, nil
}

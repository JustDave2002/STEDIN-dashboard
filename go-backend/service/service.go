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

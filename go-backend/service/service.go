package service

import (
	"context"
	"fmt"
	"k8s.io/client-go/kubernetes"
	"log"
	"main/k8sclient"
	"main/repository"
	"main/structs"
	"os"
	"os/exec"
	"time"
)

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
		if result.InstanceID != nil && *result.InstanceID > 0 {
			appExists := false
			for _, app := range deviceMap[result.DeviceID].Applications {
				if app.InstanceID == *result.InstanceID {
					appExists = true
					break
				}
			}
			if !appExists {
				deviceMap[result.DeviceID].Applications = append(deviceMap[result.DeviceID].Applications, structs.ApplicationInstanceDTO{
					InstanceID:  *result.InstanceID,
					Name:        *result.AppName,
					Status:      *result.AppStatus,
					Path:        *result.AppPath,
					Description: *result.AppDescription,
					Version:     *result.AppVersion,
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

func AddApplicationsToDevices(ctx context.Context, clientset *kubernetes.Clientset, userID int64, appID int64, deviceIDs []int64) error {
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

	// Step 2: Retrieve the application's image URL
	imageURL, err := repository.GetApplicationRepoURL(appID)
	if err != nil {
		return fmt.Errorf("failed to retrieve repo_url for application %d: %w", appID, err)
	}

	// Step 3: Add application instances and deploy them to Kubernetes
	for _, deviceID := range deviceIDs {
		// Add the application instance to the database
		err := repository.AddApplicationInstance(deviceID, appID)
		if err != nil {
			return fmt.Errorf("error adding application %d to device %d: %w", appID, deviceID, err)
		}

		// Deploy the application to Kubernetes
		appPath, deployErr := DeployApplicationToKubernetes(ctx, clientset, "edge-devices", imageURL, deviceID, appID)
		if deployErr != nil {
			return fmt.Errorf("error deploying application %d to device %d: %w", appID, deviceID, deployErr)
		}

		// Update the application's path in the database
		err = repository.UpdateApplicationPath(deviceID, appID, appPath)
		if err != nil {
			return fmt.Errorf("error updating path for application %d on device %d: %w", appID, deviceID, err)
		}
	}

	return nil
}

// DeployApplicationToKubernetes deploys the application to the Kubernetes pod of the specified device
func DeployApplicationToKubernetes(ctx context.Context, clientset *kubernetes.Clientset, namespace, imageURL string, deviceID int64, appID int64) (string, error) {
	// Deploy the container to the Kubernetes pod
	appPath, err := k8sclient.DeployAppToDevice(ctx, clientset, namespace, deviceID, appID, imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to deploy app to Kubernetes: %w", err)
	}

	return appPath, nil
}

// BuildDockerImage builds a Docker image from the given repository URL
func BuildDockerImage(repoURL, imageName string) error {
	cmd := exec.Command("docker", "build", "-t", imageName, repoURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("error building Docker image: %w", err)
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

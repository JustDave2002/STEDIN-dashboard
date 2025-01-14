package service_test

import (
	"main/repository"
	"main/service"
	"main/structs"
	"testing"
)

// Replace the actual repository function with a mock implementation
// Mock Repository Function
func mockGetAllDevicesWithApplications(meberID int64) ([]struct {
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
	tagID := int64(1)
	tagName := "Environment"
	tagType := "Category"
	tagIsEditable := true
	tagOwnerID := int64(123)

	return []struct {
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
	}{
		{
			DeviceID:             1,
			DeviceName:           "Mock Device 1",
			DeviceStatus:         "Online",
			DeviceLastContact:    "2025-01-11T12:34:56Z",
			DeviceConnectionType: "WiFi",
			Longitude:            12.34,
			Latitude:             56.78,
			DeviceIPAddress:      "192.168.1.1",
			InstanceID:           1,
			AppName:              "Mock App 1",
			AppStatus:            "Running",
			AppPath:              "/app/mock1",
			AppDescription:       "A mock application",
			AppVersion:           "1.0.0",
			TagID:                &tagID,
			TagName:              &tagName,
			TagType:              &tagType,
			TagIsEditable:        &tagIsEditable,
			TagOwnerID:           &tagOwnerID,
		},
		{
			DeviceID:             1,
			DeviceName:           "Mock Device 1",
			DeviceStatus:         "Online",
			DeviceLastContact:    "2025-01-11T12:34:56Z",
			DeviceConnectionType: "WiFi",
			Longitude:            12.34,
			Latitude:             56.78,
			DeviceIPAddress:      "192.168.1.1",
			InstanceID:           2,
			AppName:              "Mock App 2",
			AppStatus:            "Stopped",
			AppPath:              "/app/mock2",
			AppDescription:       "Another mock application",
			AppVersion:           "2.0.0",
			TagID:                nil,
			TagName:              nil,
			TagType:              nil,
			TagIsEditable:        nil,
			TagOwnerID:           nil,
		},
	}, nil
}

func TestGetAllDevicesWithApplications(t *testing.T) {
	// Backup the original function and restore it after the test
	originalRepoFunc := repository.GetAllDevicesWithApplications
	defer func() { repository.GetAllDevicesWithApplications = originalRepoFunc }()

	// Replace the repository function with the mock
	repository.GetAllDevicesWithApplications = mockGetAllDevicesWithApplications

	// Call the service function
	devices, err := service.GetAllDevicesWithApplications(123)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Assertions
	if len(devices) != 1 {
		t.Fatalf("Expected 1 device, got %d", len(devices))
	}

	device := devices[0]
	if len(device.Applications) != 2 {
		t.Errorf("Expected 2 applications, got %d", len(device.Applications))
	}

	if device.Applications[0].Name != "Mock App 1" {
		t.Errorf("Expected application name 'Mock App 1', got '%s'", device.Applications[0].Name)
	}

	if device.Tags[0].Name != "Environment" {
		t.Errorf("Expected tag name 'Environment', got '%s'", device.Tags[0].Name)
	}
}

func TestGetAllMebers(t *testing.T) {
	// Backup the original repository function and restore it after the test
	originalFunc := repository.GetAllMebers
	defer func() { repository.GetAllMebers = originalFunc }()

	// Mock implementation
	repository.GetAllMebers = func() ([]structs.Meber, error) {
		return []structs.Meber{
			{ID: 1, Name: "Meber One", Roles: []structs.Role{
				{ID: 1, Name: "Role One", Description: "First role", IsAdmin: true, IsRestricted: false},
			}},
			{ID: 2, Name: "Meber Two", Roles: []structs.Role{
				{ID: 2, Name: "Role Two", Description: "Second role", IsAdmin: false, IsRestricted: true},
			}},
		}, nil
	}

	// Call the service function
	mebers, err := service.GetAllMebers()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Assertions
	if len(mebers) != 2 {
		t.Fatalf("Expected 2 mebers, got %d", len(mebers))
	}

	if mebers[0].Name != "Meber One" {
		t.Errorf("Expected first meber name to be 'Meber One', got '%s'", mebers[0].Name)
	}

	if len(mebers[0].Roles) != 1 || mebers[0].Roles[0].Name != "Role One" {
		t.Errorf("Expected first meber to have one role named 'Role One', got %+v", mebers[0].Roles)
	}
}

func TestGetMeberByID(t *testing.T) {
	// Backup the original repository function and restore it after the test
	originalFunc := repository.GetMeberByID
	defer func() { repository.GetMeberByID = originalFunc }()

	// Mock implementation
	repository.GetMeberByID = func(meberID int64) (*structs.Meber, error) {
		if meberID == 1 {
			return &structs.Meber{
				ID:   1,
				Name: "Meber One",
				Roles: []structs.Role{
					{ID: 1, Name: "Role One", Description: "First role", IsAdmin: true, IsRestricted: false},
				},
			}, nil
		}
		return nil, nil // Simulate no result for other IDs
	}

	// Call the service function
	meber, err := service.GetMeberByID(1)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Assertions
	if meber == nil {
		t.Fatalf("Expected a meber, got nil")
	}

	if meber.ID != 1 {
		t.Errorf("Expected meber ID to be 1, got %d", meber.ID)
	}

	if meber.Name != "Meber One" {
		t.Errorf("Expected meber name to be 'Meber One', got '%s'", meber.Name)
	}

	if len(meber.Roles) != 1 || meber.Roles[0].Name != "Role One" {
		t.Errorf("Expected one role named 'Role One', got %+v", meber.Roles)
	}

	// Test for non-existent meber
	meber, err = service.GetMeberByID(2)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if meber != nil {
		t.Errorf("Expected no meber, got %+v", meber)
	}
}

package structs

import "time"

type EdgeDevice struct {
	ID                int64     `json:"id"`
	Name              string    `json:"name"`
	Status            string    `json:"status"`
	LastContact       time.Time `json:"last_contact"`
	ConnectionType    string    `json:"connection_type"`
	Latitude          float64   `json:"latitude"`
	Longitude         float64   `json:"longitude"`
	IPAddress         string    `json:"ip_address"`
	Municipality      string    `json:"municipality"`
	PerformanceMetric float64   `json:"performance_metric"`
}

type EdgeDeviceMapResponse struct {
	ID           int64   `json:"id"`
	Name         string  `json:"name"`
	Status       string  `json:"status"`
	Municipality string  `json:"municipality"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

// ApplicationWithSensors represents an application and its associated sensors
type ApplicationWithSensors struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Sensors     []Sensor `json:"sensors"`
}

// EligibleDevice represents a device and its eligibility status for installing an application
type EligibleDevice struct {
	Device   EdgeDevice `json:"device"`
	Eligible bool       `json:"eligible"`
	Reason   *string    `json:"reason,omitempty"`
}

// Sensor represents a sensor entity
type Sensor struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

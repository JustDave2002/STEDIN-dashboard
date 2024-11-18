package structs

type DeviceWithApplicationsDTO struct {
	DeviceID       int64                    `json:"device_id"`
	Name           string                   `json:"name"`
	Status         string                   `json:"status"`
	LastContact    string                   `json:"last_contact"` // Use string for JSON datetime formatting
	ConnectionType string                   `json:"connection_type"`
	Latitude       float64                  `json:"latitude"`
	Longitude      float64                  `json:"longitude"`
	IPAddress      string                   `json:"ip_address"`
	Applications   []ApplicationInstanceDTO `json:"applications"`
}

type ApplicationInstanceDTO struct {
	InstanceID  int64  `json:"instance_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
	Status      string `json:"status"`
	Path        string `json:"path"`
}

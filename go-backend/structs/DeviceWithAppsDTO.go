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
	Tags           []Tag                    `json:"tags"` // Add tags here

}

type ApplicationInstanceDTO struct {
	InstanceID  int64  `json:"instance_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
	Status      string `json:"status"`
	Path        string `json:"path"`
}

// Define the Tag domain model
// TODO:move to seperate file
type Tag struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	IsEditable bool   `json:"is_editable"`
	OwnerID    *int64 `json:"owner_id"` // Nullable foreign key
}

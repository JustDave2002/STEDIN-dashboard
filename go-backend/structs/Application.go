package structs

type Application struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
	RepoUrl     string `json:"repo_url"`
}

type ApplicationInstance struct {
	ID       int64  `json:"id"`
	AppID    int64  `json:"app_id"`
	DeviceID int64  `json:"device_id"`
	Status   string `json:"status"`
	Path     string `json:"path"`
}

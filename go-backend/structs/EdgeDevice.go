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
	PerformanceMetric float64   `json:"performance_metric"`
}

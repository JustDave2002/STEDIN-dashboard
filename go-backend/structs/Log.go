package structs

import "time"

type Log struct {
	ID            int64     `json:"id"`
	DeviceID      int64     `json:"device_id"`
	AppInstanceID *int64    `json:"app_instance_id,omitempty"` // AppInstanceID can be null, so use *int64 to make it nullable
	Description   string    `json:"description"`
	WarningLevel  string    `json:"warning_level"` // Consider using a custom type for better type safety (e.g., `LogLevel` type)
	Timestamp     time.Time `json:"timestamp"`
}

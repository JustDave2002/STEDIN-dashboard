package structs

type Role struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Description  string `json:"description"`
	IsAdmin      bool   `json:"is_admin"`
	IsRestricted bool   `json:"is_restricted"`
}

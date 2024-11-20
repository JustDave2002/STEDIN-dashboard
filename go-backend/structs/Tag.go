package structs

type Tag struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	IsEditable bool   `json:"is_editable"`
	OwnerID    *int64 `json:"owner_id"` // Nullable foreign key
}

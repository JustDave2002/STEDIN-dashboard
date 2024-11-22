package structs

type Meber struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Roles []Role `json:"roles"` // to return roles using this struct (returning the roles with mebers will probably be done in almost all use-cases.)
}

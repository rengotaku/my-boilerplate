package model

import "time"

type User struct {
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
}

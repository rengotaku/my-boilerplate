package service

import (
	"testing"

	"go-graphql-api/internal/repository"
)

func TestUserService_CreateUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	tests := []struct {
		name    string
		uname   string
		email   string
		wantErr bool
	}{
		{
			name:    "valid user",
			uname:   "John Doe",
			email:   "john@example.com",
			wantErr: false,
		},
		{
			name:    "empty name",
			uname:   "",
			email:   "john@example.com",
			wantErr: true,
		},
		{
			name:    "invalid email",
			uname:   "John Doe",
			email:   "invalid",
			wantErr: true,
		},
		{
			name:    "empty email",
			uname:   "John Doe",
			email:   "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.CreateUser(tt.uname, tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("CreateUser() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && user == nil {
				t.Error("CreateUser() returned nil user")
			}
			if !tt.wantErr && user.Name != tt.uname {
				t.Errorf("CreateUser() name = %v, want %v", user.Name, tt.uname)
			}
		})
	}
}

func TestUserService_GetUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	created, _ := svc.CreateUser("John Doe", "john@example.com")

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "existing user",
			id:      created.ID,
			wantErr: false,
		},
		{
			name:    "non-existing user",
			id:      "non-existing-id",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.GetUser(tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetUser() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && user == nil {
				t.Error("GetUser() returned nil user")
			}
		})
	}
}

func TestUserService_UpdateUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	created, _ := svc.CreateUser("John Doe", "john@example.com")

	tests := []struct {
		name    string
		id      string
		uname   string
		email   string
		wantErr bool
	}{
		{
			name:    "valid update",
			id:      created.ID,
			uname:   "Jane Doe",
			email:   "jane@example.com",
			wantErr: false,
		},
		{
			name:    "non-existing user",
			id:      "non-existing-id",
			uname:   "Jane Doe",
			email:   "jane@example.com",
			wantErr: true,
		},
		{
			name:    "invalid email",
			id:      created.ID,
			uname:   "Jane Doe",
			email:   "invalid",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.UpdateUser(tt.id, tt.uname, tt.email)
			if (err != nil) != tt.wantErr {
				t.Errorf("UpdateUser() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && user == nil {
				t.Error("UpdateUser() returned nil user")
			}
		})
	}
}

func TestUserService_DeleteUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	created, _ := svc.CreateUser("John Doe", "john@example.com")

	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{
			name:    "existing user",
			id:      created.ID,
			wantErr: false,
		},
		{
			name:    "non-existing user",
			id:      "non-existing-id",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := svc.DeleteUser(tt.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("DeleteUser() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUserService_ListUsers(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	// Empty list
	users := svc.ListUsers()
	if len(users) != 0 {
		t.Errorf("ListUsers() = %d users, want 0", len(users))
	}

	// Add users
	_, _ = svc.CreateUser("John Doe", "john@example.com")
	_, _ = svc.CreateUser("Jane Doe", "jane@example.com")

	users = svc.ListUsers()
	if len(users) != 2 {
		t.Errorf("ListUsers() = %d users, want 2", len(users))
	}
}

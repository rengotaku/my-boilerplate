package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-graphql-api/internal/repository"
	"go-graphql-api/internal/testutil"
)

func newSvc(t *testing.T) *UserService {
	t.Helper()
	return NewUserService(repository.NewUserRepository(testutil.NewTestDB(t)))
}

func TestUserService_CreateUser(t *testing.T) {
	svc := newSvc(t)

	tests := []struct {
		name    string
		uname   string
		email   string
		wantErr bool
	}{
		{"valid user", "John Doe", "john@example.com", false},
		{"empty name", "", "john@example.com", true},
		{"invalid email", "John Doe", "invalid", true},
		{"empty email", "John Doe", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.CreateUser(tt.uname, tt.email)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.NotNil(t, user)
			assert.Equal(t, tt.uname, user.Name)
		})
	}
}

func TestUserService_GetUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	user, err := svc.GetUser(created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, user.ID)

	_, err = svc.GetUser("non-existing-id")
	assert.ErrorIs(t, err, ErrUserNotFound)
}

func TestUserService_UpdateUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	tests := []struct {
		name    string
		id      string
		uname   string
		email   string
		wantErr bool
	}{
		{"valid update", created.ID, "Jane Doe", "jane@example.com", false},
		{"non-existing user", "non-existing-id", "Jane Doe", "jane@example.com", true},
		{"invalid email", created.ID, "Jane Doe", "invalid", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.UpdateUser(tt.id, tt.uname, tt.email)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.NotNil(t, user)
		})
	}
}

func TestUserService_DeleteUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	require.NoError(t, svc.DeleteUser(created.ID))
	assert.ErrorIs(t, svc.DeleteUser("non-existing-id"), ErrUserNotFound)
}

func TestUserService_ListUsers(t *testing.T) {
	svc := newSvc(t)

	users, err := svc.ListUsers()
	require.NoError(t, err)
	assert.Len(t, users, 0)

	_, _ = svc.CreateUser("John Doe", "john@example.com")
	_, _ = svc.CreateUser("Jane Doe", "jane@example.com")

	users, err = svc.ListUsers()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

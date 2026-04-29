package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-rest-api/internal/repository"
	"go-rest-api/internal/testutil"
)

func newTestService(t *testing.T) *UserService {
	t.Helper()
	return NewUserService(repository.NewUserRepository(testutil.NewTestDB(t)))
}

func TestUserService_CreateUser(t *testing.T) {
	svc := newTestService(t)

	tests := []struct {
		wantErr  error
		name     string
		uname    string
		email    string
		password string
	}{
		{name: "valid", uname: "John", email: "john@example.com", password: "pass1234"},
		{name: "duplicate email", uname: "John2", email: "john@example.com", password: "pass1234", wantErr: ErrEmailTaken},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := svc.CreateUser(tt.uname, tt.email, tt.password)
			if tt.wantErr != nil {
				assert.ErrorIs(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.NotEmpty(t, user.ID)
			assert.Equal(t, tt.uname, user.Name)
		})
	}
}

func TestUserService_GetUser(t *testing.T) {
	svc := newTestService(t)
	created, _ := svc.CreateUser("John", "john@example.com", "pass1234")

	user, err := svc.GetUser(created.ID)
	require.NoError(t, err)
	assert.Equal(t, created.ID, user.ID)

	_, err = svc.GetUser("non-existing")
	assert.ErrorIs(t, err, ErrUserNotFound)
}

func TestUserService_UpdateUser(t *testing.T) {
	svc := newTestService(t)
	created, _ := svc.CreateUser("John", "john@example.com", "pass1234")

	updated, err := svc.UpdateUser(created.ID, "Jane", "jane@example.com")
	require.NoError(t, err)
	assert.Equal(t, "Jane", updated.Name)

	_, err = svc.UpdateUser("non-existing", "Name", "x@example.com")
	assert.ErrorIs(t, err, ErrUserNotFound)
}

func TestUserService_DeleteUser(t *testing.T) {
	svc := newTestService(t)
	created, _ := svc.CreateUser("John", "john@example.com", "pass1234")

	require.NoError(t, svc.DeleteUser(created.ID))
	assert.ErrorIs(t, svc.DeleteUser("non-existing"), ErrUserNotFound)
}

func TestUserService_ListUsers(t *testing.T) {
	svc := newTestService(t)

	users, err := svc.ListUsers()
	require.NoError(t, err)
	assert.Empty(t, users)

	_, _ = svc.CreateUser("Alice", "alice@example.com", "pass1234")
	_, _ = svc.CreateUser("Bob", "bob@example.com", "pass1234")

	users, err = svc.ListUsers()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestUserService_Authenticate(t *testing.T) {
	svc := newTestService(t)
	_, _ = svc.CreateUser("John", "john@example.com", "correctpass")

	user, err := svc.Authenticate("john@example.com", "correctpass")
	require.NoError(t, err)
	assert.Equal(t, "john@example.com", user.Email)

	_, err = svc.Authenticate("john@example.com", "wrongpass")
	assert.ErrorIs(t, err, ErrInvalidCredentials)

	_, err = svc.Authenticate("nobody@example.com", "pass")
	assert.ErrorIs(t, err, ErrInvalidCredentials)
}

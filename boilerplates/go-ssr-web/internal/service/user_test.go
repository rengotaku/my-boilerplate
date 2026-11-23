package service_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/service"
	"go-ssr-web/internal/testutil"
)

func newSvc(t *testing.T) *service.UserService {
	t.Helper()
	return service.NewUserService(repository.NewUserRepository(testutil.NewTestDB(t)))
}

func TestUserService_CreateAndList(t *testing.T) {
	svc := newSvc(t)
	user, err := svc.CreateUser("John Doe", "john@example.com", "secret123")
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.NotEqual(t, "secret123", user.PasswordHash, "password must be hashed")

	users, err := svc.ListUsers()
	require.NoError(t, err)
	assert.Len(t, users, 1)
}

func TestUserService_GetUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		user, err := svc.GetUser(created.ID)
		require.NoError(t, err)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("missing user", func(t *testing.T) {
		_, err := svc.GetUser("non-existing-id")
		assert.ErrorIs(t, err, service.ErrUserNotFound)
	})
}

func TestUserService_UpdateUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		updated, err := svc.UpdateUser(created.ID, "Jane", "jane@example.com")
		require.NoError(t, err)
		assert.Equal(t, "Jane", updated.Name)
		assert.Equal(t, "jane@example.com", updated.Email)
	})

	t.Run("missing user", func(t *testing.T) {
		_, err := svc.UpdateUser("non-existing-id", "x", "y@example.com")
		assert.ErrorIs(t, err, service.ErrUserNotFound)
	})
}

func TestUserService_DeleteUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		require.NoError(t, svc.DeleteUser(created.ID))
	})

	t.Run("missing user", func(t *testing.T) {
		err := svc.DeleteUser("non-existing-id")
		assert.ErrorIs(t, err, service.ErrUserNotFound)
	})
}

func TestUserService_Authenticate(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John", "john@example.com", "secret123")
	require.NoError(t, err)

	t.Run("valid credentials", func(t *testing.T) {
		user, err := svc.Authenticate("john@example.com", "secret123")
		require.NoError(t, err)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("wrong password", func(t *testing.T) {
		_, err := svc.Authenticate("john@example.com", "bad")
		assert.ErrorIs(t, err, service.ErrInvalidCredentials)
	})

	t.Run("unknown email", func(t *testing.T) {
		_, err := svc.Authenticate("ghost@example.com", "x")
		assert.ErrorIs(t, err, service.ErrInvalidCredentials)
	})
}

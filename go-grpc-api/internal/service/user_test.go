package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-grpc-api/internal/repository"
	"go-grpc-api/internal/testutil"
)

func newSvc(t *testing.T) *UserService {
	t.Helper()
	return NewUserService(repository.NewUserRepository(testutil.NewTestDB(t)))
}

func TestUserService_ListUsers(t *testing.T) {
	svc := newSvc(t)

	_, _ = svc.CreateUser("User 1", "user1@example.com")
	_, _ = svc.CreateUser("User 2", "user2@example.com")

	users, err := svc.ListUsers()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestUserService_GetUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		user, err := svc.GetUser(created.ID)
		require.NoError(t, err)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("non-existing user", func(t *testing.T) {
		user, err := svc.GetUser("non-existing-id")
		assert.Nil(t, user)
		assert.ErrorIs(t, err, ErrUserNotFound)
	})
}

func TestUserService_CreateUser(t *testing.T) {
	svc := newSvc(t)
	user, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
}

func TestUserService_UpdateUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		updated, err := svc.UpdateUser(created.ID, "Jane Doe", "jane@example.com")
		require.NoError(t, err)
		assert.Equal(t, "Jane Doe", updated.Name)
		assert.Equal(t, "jane@example.com", updated.Email)
	})

	t.Run("non-existing user", func(t *testing.T) {
		updated, err := svc.UpdateUser("non-existing-id", "Jane Doe", "jane@example.com")
		assert.Nil(t, updated)
		assert.ErrorIs(t, err, ErrUserNotFound)
	})
}

func TestUserService_DeleteUser(t *testing.T) {
	svc := newSvc(t)
	created, err := svc.CreateUser("John Doe", "john@example.com")
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		require.NoError(t, svc.DeleteUser(created.ID))
	})

	t.Run("non-existing user", func(t *testing.T) {
		assert.ErrorIs(t, svc.DeleteUser("non-existing-id"), ErrUserNotFound)
	})
}

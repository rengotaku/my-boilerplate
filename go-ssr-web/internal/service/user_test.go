package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/repository"
)

func TestUserService_ListUsers(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	repo.Create("User 1", "user1@example.com")
	repo.Create("User 2", "user2@example.com")

	users := svc.ListUsers()
	assert.Len(t, users, 2)
}

func TestUserService_GetUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)
	created := repo.Create("John Doe", "john@example.com")

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
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)

	user := svc.CreateUser("John Doe", "john@example.com")

	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
}

func TestUserService_UpdateUser(t *testing.T) {
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)
	created := repo.Create("John Doe", "john@example.com")

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
	repo := repository.NewUserRepository()
	svc := NewUserService(repo)
	created := repo.Create("John Doe", "john@example.com")

	t.Run("existing user", func(t *testing.T) {
		err := svc.DeleteUser(created.ID)
		require.NoError(t, err)
	})

	t.Run("non-existing user", func(t *testing.T) {
		err := svc.DeleteUser("non-existing-id")
		assert.ErrorIs(t, err, ErrUserNotFound)
	})
}

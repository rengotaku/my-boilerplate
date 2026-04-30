package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-grpc-api/internal/model"
	"go-grpc-api/internal/testutil"
)

func newRepo(t *testing.T) *UserRepository {
	t.Helper()
	return NewUserRepository(testutil.NewTestDB(t))
}

func TestUserRepository_Create(t *testing.T) {
	repo := newRepo(t)
	user, err := repo.Create(&model.User{Name: "John Doe", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
	assert.False(t, user.CreatedAt.IsZero())
}

func TestUserRepository_FindAll(t *testing.T) {
	repo := newRepo(t)

	_, _ = repo.Create(&model.User{Name: "User 1", Email: "user1@example.com", PasswordHash: "h"})
	_, _ = repo.Create(&model.User{Name: "User 2", Email: "user2@example.com", PasswordHash: "h"})

	users, err := repo.FindAll()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestUserRepository_FindByID(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John Doe", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		user, err := repo.FindByID(created.ID)
		require.NoError(t, err)
		require.NotNil(t, user)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("non-existing user", func(t *testing.T) {
		user, err := repo.FindByID("non-existing-id")
		require.NoError(t, err)
		assert.Nil(t, user)
	})
}

func TestUserRepository_Update(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John Doe", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		created.Name = "Jane Doe"
		created.Email = "jane@example.com"
		updated, err := repo.Update(created)
		require.NoError(t, err)
		assert.Equal(t, "Jane Doe", updated.Name)
		assert.Equal(t, "jane@example.com", updated.Email)
	})
}

func TestUserRepository_Delete(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John Doe", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		require.NoError(t, repo.Delete(created.ID))
		user, err := repo.FindByID(created.ID)
		require.NoError(t, err)
		assert.Nil(t, user)
	})

	t.Run("non-existing user", func(t *testing.T) {
		assert.ErrorIs(t, repo.Delete("non-existing-id"), ErrNotFound)
	})
}

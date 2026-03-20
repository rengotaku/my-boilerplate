package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository_Create(t *testing.T) {
	repo := NewUserRepository()

	user := repo.Create("John Doe", "john@example.com")

	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "John Doe", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
	assert.False(t, user.CreatedAt.IsZero())
	assert.False(t, user.UpdatedAt.IsZero())
}

func TestUserRepository_FindAll(t *testing.T) {
	repo := NewUserRepository()

	repo.Create("User 1", "user1@example.com")
	repo.Create("User 2", "user2@example.com")

	users := repo.FindAll()

	assert.Len(t, users, 2)
}

func TestUserRepository_FindByID(t *testing.T) {
	repo := NewUserRepository()
	created := repo.Create("John Doe", "john@example.com")

	t.Run("existing user", func(t *testing.T) {
		user := repo.FindByID(created.ID)
		require.NotNil(t, user)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("non-existing user", func(t *testing.T) {
		user := repo.FindByID("non-existing-id")
		assert.Nil(t, user)
	})
}

func TestUserRepository_Update(t *testing.T) {
	repo := NewUserRepository()
	created := repo.Create("John Doe", "john@example.com")

	t.Run("existing user", func(t *testing.T) {
		updated := repo.Update(created.ID, "Jane Doe", "jane@example.com")
		require.NotNil(t, updated)
		assert.Equal(t, "Jane Doe", updated.Name)
		assert.Equal(t, "jane@example.com", updated.Email)
		assert.True(t, updated.UpdatedAt.After(created.CreatedAt))
	})

	t.Run("non-existing user", func(t *testing.T) {
		updated := repo.Update("non-existing-id", "Jane Doe", "jane@example.com")
		assert.Nil(t, updated)
	})
}

func TestUserRepository_Delete(t *testing.T) {
	repo := NewUserRepository()
	created := repo.Create("John Doe", "john@example.com")

	t.Run("existing user", func(t *testing.T) {
		deleted := repo.Delete(created.ID)
		assert.True(t, deleted)
		assert.Nil(t, repo.FindByID(created.ID))
	})

	t.Run("non-existing user", func(t *testing.T) {
		deleted := repo.Delete("non-existing-id")
		assert.False(t, deleted)
	})
}

package repository

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"go-rest-api/internal/model"
	"go-rest-api/internal/testutil"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	return testutil.NewTestDB(t)
}

func TestUserRepository_Create(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	user := &model.User{Name: "John Doe", Email: "john@example.com", PasswordHash: "hash"}
	created, err := repo.Create(user)
	require.NoError(t, err)
	assert.NotEmpty(t, created.ID)
	assert.Equal(t, "John Doe", created.Name)
	assert.Equal(t, "john@example.com", created.Email)
	assert.False(t, created.CreatedAt.IsZero())
}

func TestUserRepository_FindAll(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	users, err := repo.FindAll()
	require.NoError(t, err)
	assert.Empty(t, users)

	_, _ = repo.Create(&model.User{Name: "Alice", Email: "alice@example.com", PasswordHash: "h"})
	_, _ = repo.Create(&model.User{Name: "Bob", Email: "bob@example.com", PasswordHash: "h"})

	users, err = repo.FindAll()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestUserRepository_FindByID(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	created, _ := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})

	user, err := repo.FindByID(created.ID)
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, created.ID, user.ID)

	missing, err := repo.FindByID("non-existing-id")
	require.NoError(t, err)
	assert.Nil(t, missing)
}

func TestUserRepository_FindByEmail(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	_, _ = repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})

	user, err := repo.FindByEmail("john@example.com")
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, "john@example.com", user.Email)

	missing, err := repo.FindByEmail("nobody@example.com")
	require.NoError(t, err)
	assert.Nil(t, missing)
}

func TestUserRepository_Update(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	created, _ := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
	created.Name = "Jane"
	created.Email = "jane@example.com"

	updated, err := repo.Update(created)
	require.NoError(t, err)
	assert.Equal(t, "Jane", updated.Name)
	assert.Equal(t, "jane@example.com", updated.Email)
}

func TestUserRepository_Delete(t *testing.T) {
	repo := NewUserRepository(setupTestDB(t))

	created, _ := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})

	require.NoError(t, repo.Delete(created.ID))

	user, _ := repo.FindByID(created.ID)
	assert.Nil(t, user)

	assert.ErrorIs(t, repo.Delete("non-existing-id"), ErrNotFound)
}

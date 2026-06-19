package repository_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/model"
	"go-ssr-web/internal/repository"
	"go-ssr-web/internal/testutil"
)

func newRepo(t *testing.T) *repository.UserRepository {
	t.Helper()
	return repository.NewUserRepository(testutil.NewTestDB(t))
}

func TestUserRepository_Create(t *testing.T) {
	repo := newRepo(t)
	user, err := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)
	assert.Equal(t, "John", user.Name)
	assert.Equal(t, "john@example.com", user.Email)
	assert.False(t, user.CreatedAt.IsZero())
}

func TestUserRepository_FindAll(t *testing.T) {
	repo := newRepo(t)
	_, err := repo.Create(&model.User{Name: "U1", Email: "u1@example.com", PasswordHash: "h"})
	require.NoError(t, err)
	_, err = repo.Create(&model.User{Name: "U2", Email: "u2@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	users, err := repo.FindAll()
	require.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestUserRepository_FindByID(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
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

func TestUserRepository_FindByEmail(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	t.Run("existing", func(t *testing.T) {
		user, err := repo.FindByEmail("john@example.com")
		require.NoError(t, err)
		require.NotNil(t, user)
		assert.Equal(t, created.ID, user.ID)
	})

	t.Run("missing", func(t *testing.T) {
		user, err := repo.FindByEmail("missing@example.com")
		require.NoError(t, err)
		assert.Nil(t, user)
	})
}

func TestUserRepository_Update(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	created.Name = "Jane"
	created.Email = "jane@example.com"
	updated, err := repo.Update(created)
	require.NoError(t, err)
	assert.Equal(t, "Jane", updated.Name)
	assert.Equal(t, "jane@example.com", updated.Email)
}

func TestUserRepository_Delete(t *testing.T) {
	repo := newRepo(t)
	created, err := repo.Create(&model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"})
	require.NoError(t, err)

	t.Run("existing user", func(t *testing.T) {
		require.NoError(t, repo.Delete(created.ID))
		got, err := repo.FindByID(created.ID)
		require.NoError(t, err)
		assert.Nil(t, got)
	})

	t.Run("non-existing user", func(t *testing.T) {
		err := repo.Delete("non-existing-id")
		assert.ErrorIs(t, err, repository.ErrNotFound)
	})
}

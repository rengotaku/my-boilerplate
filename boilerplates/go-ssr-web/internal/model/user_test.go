package model_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-ssr-web/internal/model"
	"go-ssr-web/internal/testutil"
)

func TestUser_BeforeCreate_AssignsID(t *testing.T) {
	db := testutil.NewTestDB(t)

	user := &model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"}
	require.NoError(t, db.Create(user).Error)
	assert.NotEmpty(t, user.ID)
}

func TestUser_BeforeCreate_KeepsExistingID(t *testing.T) {
	db := testutil.NewTestDB(t)

	user := &model.User{ID: "fixed-id", Name: "John", Email: "john@example.com", PasswordHash: "h"}
	require.NoError(t, db.Create(user).Error)
	assert.Equal(t, "fixed-id", user.ID)
}

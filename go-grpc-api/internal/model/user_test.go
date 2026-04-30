package model_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"go-grpc-api/internal/model"
	"go-grpc-api/internal/testutil"
)

func TestUser_BeforeCreate(t *testing.T) {
	db := testutil.NewTestDB(t)

	user := &model.User{Name: "John", Email: "john@example.com", PasswordHash: "h"}
	require.NoError(t, db.Create(user).Error)
	assert.NotEmpty(t, user.ID)
}

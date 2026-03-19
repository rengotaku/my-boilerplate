package repository

import (
	"testing"
)

func TestUserRepository_Create(t *testing.T) {
	repo := NewUserRepository()

	user := repo.Create("John Doe", "john@example.com")

	if user == nil {
		t.Fatal("Create() returned nil")
	}
	if user.ID == "" {
		t.Error("Create() ID is empty")
	}
	if user.Name != "John Doe" {
		t.Errorf("Create() Name = %v, want John Doe", user.Name)
	}
	if user.Email != "john@example.com" {
		t.Errorf("Create() Email = %v, want john@example.com", user.Email)
	}
	if user.CreatedAt.IsZero() {
		t.Error("Create() CreatedAt is zero")
	}
	if user.UpdatedAt.IsZero() {
		t.Error("Create() UpdatedAt is zero")
	}
}

func TestUserRepository_FindAll(t *testing.T) {
	repo := NewUserRepository()

	// Empty repository
	users := repo.FindAll()
	if len(users) != 0 {
		t.Errorf("FindAll() = %d, want 0", len(users))
	}

	// Add users
	repo.Create("John Doe", "john@example.com")
	repo.Create("Jane Doe", "jane@example.com")

	users = repo.FindAll()
	if len(users) != 2 {
		t.Errorf("FindAll() = %d, want 2", len(users))
	}
}

func TestUserRepository_FindByID(t *testing.T) {
	repo := NewUserRepository()

	created := repo.Create("John Doe", "john@example.com")

	// Find existing user
	user := repo.FindByID(created.ID)
	if user == nil {
		t.Fatal("FindByID() returned nil for existing user")
	}
	if user.ID != created.ID {
		t.Errorf("FindByID() ID = %v, want %v", user.ID, created.ID)
	}

	// Find non-existing user
	user = repo.FindByID("non-existing-id")
	if user != nil {
		t.Error("FindByID() should return nil for non-existing user")
	}
}

func TestUserRepository_Update(t *testing.T) {
	repo := NewUserRepository()

	created := repo.Create("John Doe", "john@example.com")
	originalUpdatedAt := created.UpdatedAt

	// Update existing user
	updated := repo.Update(created.ID, "Jane Doe", "jane@example.com")
	if updated == nil {
		t.Fatal("Update() returned nil for existing user")
	}
	if updated.Name != "Jane Doe" {
		t.Errorf("Update() Name = %v, want Jane Doe", updated.Name)
	}
	if updated.Email != "jane@example.com" {
		t.Errorf("Update() Email = %v, want jane@example.com", updated.Email)
	}
	if !updated.UpdatedAt.After(originalUpdatedAt) && updated.UpdatedAt != originalUpdatedAt {
		t.Error("Update() should update UpdatedAt")
	}

	// Update non-existing user
	updated = repo.Update("non-existing-id", "Name", "email@example.com")
	if updated != nil {
		t.Error("Update() should return nil for non-existing user")
	}
}

func TestUserRepository_Delete(t *testing.T) {
	repo := NewUserRepository()

	created := repo.Create("John Doe", "john@example.com")

	// Delete existing user
	deleted := repo.Delete(created.ID)
	if !deleted {
		t.Error("Delete() should return true for existing user")
	}

	// Verify user is deleted
	user := repo.FindByID(created.ID)
	if user != nil {
		t.Error("User should be deleted")
	}

	// Delete non-existing user
	deleted = repo.Delete("non-existing-id")
	if deleted {
		t.Error("Delete() should return false for non-existing user")
	}
}

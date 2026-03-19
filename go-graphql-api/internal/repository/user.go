package repository

import (
	"sync"
	"time"

	"github.com/google/uuid"

	"go-graphql-api/internal/graph/model"
)

type UserRepository struct {
	users map[string]*model.User
	mu    sync.RWMutex
}

func NewUserRepository() *UserRepository {
	return &UserRepository{
		users: make(map[string]*model.User),
	}
}

func (r *UserRepository) FindAll() []*model.User {
	r.mu.RLock()
	defer r.mu.RUnlock()

	users := make([]*model.User, 0, len(r.users))
	for _, u := range r.users {
		users = append(users, u)
	}
	return users
}

func (r *UserRepository) FindByID(id string) *model.User {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.users[id]
}

func (r *UserRepository) Create(name, email string) *model.User {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	user := &model.User{
		ID:        uuid.New().String(),
		Name:      name,
		Email:     email,
		CreatedAt: now,
		UpdatedAt: now,
	}
	r.users[user.ID] = user
	return user
}

func (r *UserRepository) Update(id, name, email string) *model.User {
	r.mu.Lock()
	defer r.mu.Unlock()

	user, ok := r.users[id]
	if !ok {
		return nil
	}

	user.Name = name
	user.Email = email
	user.UpdatedAt = time.Now()
	return user
}

func (r *UserRepository) Delete(id string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.users[id]; !ok {
		return false
	}
	delete(r.users, id)
	return true
}

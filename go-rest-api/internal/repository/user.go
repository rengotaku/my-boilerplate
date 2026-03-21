package repository

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

type User struct {
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
}

type UserRepository struct {
	users map[string]*User
	mu    sync.RWMutex
}

func NewUserRepository() *UserRepository {
	return &UserRepository{
		users: make(map[string]*User),
	}
}

func (r *UserRepository) FindAll() []*User {
	r.mu.RLock()
	defer r.mu.RUnlock()

	users := make([]*User, 0, len(r.users))
	for _, u := range r.users {
		users = append(users, u)
	}
	return users
}

func (r *UserRepository) FindByID(id string) *User {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.users[id]
}

func (r *UserRepository) Create(name, email string) *User {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	user := &User{
		ID:        uuid.New().String(),
		Name:      name,
		Email:     email,
		CreatedAt: now,
		UpdatedAt: now,
	}
	r.users[user.ID] = user
	return user
}

func (r *UserRepository) Update(id, name, email string) *User {
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

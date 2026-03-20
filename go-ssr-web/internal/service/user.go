package service

import (
	"errors"

	"go-ssr-web/internal/repository"
)

var ErrUserNotFound = errors.New("user not found")

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) ListUsers() []*repository.User {
	return s.repo.FindAll()
}

func (s *UserService) GetUser(id string) (*repository.User, error) {
	user := s.repo.FindByID(id)
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *UserService) CreateUser(name, email string) *repository.User {
	return s.repo.Create(name, email)
}

func (s *UserService) UpdateUser(id, name, email string) (*repository.User, error) {
	user := s.repo.Update(id, name, email)
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *UserService) DeleteUser(id string) error {
	if !s.repo.Delete(id) {
		return ErrUserNotFound
	}
	return nil
}

package service

import (
	"errors"
	"fmt"
	"regexp"

	"go-graphql-api/internal/graph/model"
	"go-graphql-api/internal/repository"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrValidation   = errors.New("validation error")

	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) ListUsers() []*model.User {
	return s.repo.FindAll()
}

func (s *UserService) GetUser(id string) (*model.User, error) {
	user := s.repo.FindByID(id)
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *UserService) CreateUser(name, email string) (*model.User, error) {
	if err := s.validateUser(name, email); err != nil {
		return nil, err
	}
	return s.repo.Create(name, email), nil
}

func (s *UserService) UpdateUser(id, name, email string) (*model.User, error) {
	if err := s.validateUser(name, email); err != nil {
		return nil, err
	}

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

func (s *UserService) validateUser(name, email string) error {
	if name == "" {
		return fmt.Errorf("%w: name is required", ErrValidation)
	}
	if len(name) > 100 {
		return fmt.Errorf("%w: name must be 100 characters or less", ErrValidation)
	}
	if email == "" {
		return fmt.Errorf("%w: email is required", ErrValidation)
	}
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("%w: invalid email format", ErrValidation)
	}
	return nil
}

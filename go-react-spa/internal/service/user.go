package service

import (
	"errors"
	"fmt"

	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/go-ozzo/ozzo-validation/v4/is"

	"go-react-spa/internal/repository"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrValidation   = errors.New("validation error")
)

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

func (s *UserService) CreateUser(name, email string) (*repository.User, error) {
	if err := s.validateUser(name, email); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrValidation, err)
	}

	return s.repo.Create(name, email), nil
}

func (s *UserService) UpdateUser(id, name, email string) (*repository.User, error) {
	if err := s.validateUser(name, email); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrValidation, err)
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
	return validation.Errors{
		"name":  validation.Validate(name, validation.Required, validation.Length(1, 100)),
		"email": validation.Validate(email, validation.Required, is.Email),
	}.Filter()
}

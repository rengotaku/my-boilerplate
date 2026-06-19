package service

import (
	"errors"

	"go-grpc-api/internal/model"
	"go-grpc-api/internal/repository"
)

var ErrUserNotFound = errors.New("user not found")

type UserService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) ListUsers() ([]*model.User, error) {
	return s.repo.FindAll()
}

func (s *UserService) GetUser(id string) (*model.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *UserService) CreateUser(name, email string) (*model.User, error) {
	return s.repo.Create(&model.User{Name: name, Email: email, PasswordHash: ""})
}

func (s *UserService) UpdateUser(id, name, email string) (*model.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	user.Name = name
	user.Email = email
	return s.repo.Update(user)
}

func (s *UserService) DeleteUser(id string) error {
	err := s.repo.Delete(id)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrUserNotFound
	}
	return err
}

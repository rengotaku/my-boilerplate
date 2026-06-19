package service

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"go-ssr-web/internal/model"
	"go-ssr-web/internal/repository"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

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

func (s *UserService) CreateUser(name, email, password string) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return s.repo.Create(&model.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
	})
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

func (s *UserService) Authenticate(email, password string) (*model.User, error) {
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return user, nil
}

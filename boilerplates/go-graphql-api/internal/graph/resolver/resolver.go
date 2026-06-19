package resolver

import "go-graphql-api/internal/service"

// Resolver is the root resolver.
type Resolver struct {
	UserService *service.UserService
}

// NewResolver creates a new resolver.
func NewResolver(userService *service.UserService) *Resolver {
	return &Resolver{
		UserService: userService,
	}
}

.PHONY: dev build preview stop status lint format test test-watch test-coverage clean codegen codegen-watch

# Variables
PORT ?= 5174

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

stop:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null || true

status:
	@lsof -i :$(PORT) >/dev/null 2>&1 && echo "react-spa-graphql: running (:$(PORT))" || echo "react-spa-graphql: stopped"

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

format-check:
	npm run format:check

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

coverage:
	npm run test:coverage

codegen:
	npm run codegen

codegen-watch:
	npm run codegen:watch

clean:
	rm -rf dist node_modules coverage src/graphql/generated

install:
	npm install

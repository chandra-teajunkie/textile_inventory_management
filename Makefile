# Project Variables
VERSION ?= latest  # Default to 'latest' unless overridden
NAMESPACE := default

# Image / container defaults (can be overridden on the make command line)
# Frontend
FRONTEND_IMAGE_NAME ?= sidhu-textiles-frontend
FRONTEND_IMAGE_TAG ?= $(VERSION)
FRONTEND_IMAGE ?= $(FRONTEND_IMAGE_NAME):$(FRONTEND_IMAGE_TAG)
FRONTEND_PORT ?= 8080
FRONTEND_CONTAINER ?= sidhu-textiles-frontend-container
FRONTEND_DETACH ?= true
# Optional runtime override for backend URL (passed into frontend container as BACKEND_URL)
RUNTIME_BACKEND_URL ?=
# Backend
BACKEND_IMAGE_NAME ?= sidhu-textiles-backend
BACKEND_IMAGE_TAG ?= $(VERSION)
BACKEND_IMAGE ?= $(BACKEND_IMAGE_NAME):$(BACKEND_IMAGE_TAG)
BACKEND_PORT ?= 3002
BACKEND_CONTAINER ?= sidhu-textiles-backend-container
BACKEND_DETACH ?= true

# === Build Docker Images ===
build-all:
	make build-backend
	make build-frontend

build-backend:
	docker build -t $(BACKEND_IMAGE) backend


build-frontend:
	docker build -t $(FRONTEND_IMAGE) frontend

# === Run frontend image locally ===
# Usage examples:
#   make run-frontend
#   make run-frontend FRONTEND_PORT=3000 FRONTEND_DETACH=true

FRONTEND_RUN_OPTS := $(if $(filter true,$(FRONTEND_DETACH)),-d,--rm)
FRONTEND_DOCKER_ENV := $(if $(RUNTIME_BACKEND_URL),-e BACKEND_URL=$(RUNTIME_BACKEND_URL),)

# Cross-platform null redirect (NUL on Windows, /dev/null on Unix)
ifeq ($(OS),Windows_NT)
  REDIR_NULL := >NUL 2>&1
else
  REDIR_NULL := >/dev/null 2>&1
endif

run-frontend:
	-@docker stop $(FRONTEND_CONTAINER) $(REDIR_NULL)
	-@docker rm -f $(FRONTEND_CONTAINER) $(REDIR_NULL)

	docker run $(FRONTEND_RUN_OPTS) $(FRONTEND_DOCKER_ENV) --name $(FRONTEND_CONTAINER) -p $(FRONTEND_PORT):80 $(FRONTEND_IMAGE)

build-run-frontend: build-frontend run-frontend

stop-frontend:
	@echo "Stopping frontend container..."
	-docker stop $(FRONTEND_CONTAINER) $(REDIR_NULL)
	-docker rm -f $(FRONTEND_CONTAINER) $(REDIR_NULL)
	@echo "Frontend container stopped."

# === Run backend image locally ===
# Usage examples:
#   make run-backend
#   make run-backend BACKEND_PORT=3333 BACKEND_DETACH=true

BACKEND_RUN_OPTS := $(if $(filter true,$(BACKEND_DETACH)),-d,--rm)

run-backend:
	-@docker stop $(BACKEND_CONTAINER) $(REDIR_NULL)
	-@docker rm -f $(BACKEND_CONTAINER) $(REDIR_NULL)

	docker run $(BACKEND_RUN_OPTS) --name $(BACKEND_CONTAINER) -p $(BACKEND_PORT):3002 $(BACKEND_IMAGE)

build-run-backend: build-backend run-backend

stop-backend:
	@echo "Stopping backend container..."
	-docker stop $(BACKEND_CONTAINER) $(REDIR_NULL)
	-docker rm -f $(BACKEND_CONTAINER) $(REDIR_NULL)
	@echo "Backend container stopped."

# Build and run both frontend and backend
run-all: build-run-backend build-run-frontend

# === Deploy to Kubernetes ===
k8s-deploy:
	kubectl apply -f k8s/
	kubectl get pods

# === Delete Kubernetes Deployment (for resets) ===
k8s-delete:
	kubectl delete -f k8s/

# === Restart Kubernetes Deployment ===
k8s-redeploy: k8s-delete k8s-deploy

repeat-backend: k8s-delete build-backend k8s-deploy
repeat-frontend: k8s-delete build-frontend k8s-deploy
repeat-all: k8s-delete build-all k8s-deploy

# === Clean Up Docker ===
docker-clean:
	@for /F "tokens=*" %%i in ('docker ps -aq') do docker stop %%i
	@for /F "tokens=*" %%i in ('docker ps -aq') do docker rm -f %%i
	@for /F "tokens=*" %%i in ('docker images -aq') do docker rmi -f %%i
	docker volume prune -f
	docker network prune -f

install_helm_cnpg_operator:
	helm repo add cnpg https://cloudnative-pg.github.io/charts
	helm repo update

	helm upgrade --install cnpg-operator \
	  cnpg/cloudnative-pg \
	  --namespace $(NAMESPACE) \
	  --create-namespace \
	  --set config.clusterWide=false

# === Helm Deployments ===

# === Helm Installs ===

# Local deployment (uses values_local.yaml)
install_helm_local:
	helm upgrade --install sidhu-textiles-app \
		./k8s/sidhu-textiles-app \
		--namespace $(NAMESPACE) \
		--create-namespace \
		-f ./k8s/sidhu-textiles-app/values_local.yaml

# Production deployment (uses values_prod.yaml)
install_helm_prod:
	helm upgrade --install sidhu-textiles-app \
		./k8s/sidhu-textiles-app \
		--namespace $(NAMESPACE) \
		--create-namespace \
		-f ./k8s/sidhu-textiles-app/values_prod.yaml

# === Uninstall Helm Deployment ===
uninstall_helm:
	helm uninstall sidhu-textiles-app --namespace $(NAMESPACE) || true

port_forward:
	port_forward_local.bat

# === Local PostgreSQL Development ===

POSTGRES_CONTAINER_NAME := sidhu-textiles-postgres-dev
POSTGRES_DB := sidhu_textiles_db
POSTGRES_USER := sidhu_textiles_user
POSTGRES_PASSWORD := sidhu_textiles_pass
POSTGRES_PORT := 5432

# Start PostgreSQL container for local dev
postgres-up:
	-docker stop $(POSTGRES_CONTAINER_NAME)
	-docker rm $(POSTGRES_CONTAINER_NAME)
	docker run -d \
	--name $(POSTGRES_CONTAINER_NAME) \
	-e POSTGRES_USER=$(POSTGRES_USER) \
	-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
	-p $(POSTGRES_PORT):$(POSTGRES_PORT) \
	postgres:16-alpine

# Stop and remove PostgreSQL container
postgres-down:
	@echo "🧹 Stopping and removing PostgreSQL container..."
	-docker stop $(POSTGRES_CONTAINER_NAME)
	-docker rm -f $(POSTGRES_CONTAINER_NAME)
	@echo "✅ PostgreSQL container removed."

# Recreate PostgreSQL container (fresh start)
postgres-recreate: postgres-down postgres-up
	@echo "🔁 Recreated PostgreSQL local dev container successfully."

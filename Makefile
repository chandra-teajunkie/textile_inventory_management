# Project Variables
VERSION ?= latest  # Default to 'latest' unless overridden
NAMESPACE := default

# Image / container defaults (can be overridden on the make command line)
# Frontend
FRONTEND_IMAGE_NAME ?= sidhu-textiles-frontend
FRONTEND_IMAGE_TAG ?= $(VERSION)
FRONTEND_IMAGE ?= $(FRONTEND_IMAGE_NAME):$(FRONTEND_IMAGE_TAG)
FRONTEND_PORT ?= 3000
FRONTEND_CONTAINER ?= $(FRONTEND_IMAGE_NAME)-container

# Backend
BACKEND_IMAGE_NAME ?= sidhu-textiles-backend
BACKEND_IMAGE_TAG ?= $(VERSION)
BACKEND_IMAGE ?= $(BACKEND_IMAGE_NAME):$(BACKEND_IMAGE_TAG)
BACKEND_PORT ?= 3002
BACKEND_CONTAINER ?= $(BACKEND_IMAGE_NAME)-container

# Optional runtime override for backend URL (passed into frontend container as BACKEND_URL)
RUNTIME_BACKEND_URL ?= http://localhost:$(BACKEND_PORT)

# === Build Docker Images ===
build-all: build-backend build-frontend

build-backend:
	cd backend && docker build --no-cache -t $(BACKEND_IMAGE) .

build-frontend:
	cd frontend && docker build --no-cache -t $(FRONTEND_IMAGE) .

# === Run Backend ===
# Set USE_POSTGRES=1 to use Postgres instead of SQLite
USE_POSTGRES ?= 1

run-backend:
	-docker stop $(BACKEND_CONTAINER)
	-docker rm -f $(BACKEND_CONTAINER)
ifeq ($(USE_POSTGRES),1)
	@echo "🚀 Starting backend container with Postgres configuration"
	docker run -d \
		--name $(BACKEND_CONTAINER) \
		--network="host" \
		-e DB_TYPE=postgres \
		-e POSTGRES_USER=$(POSTGRES_USER) \
		-e POSTGRES_PASSWORD=$(POSTGRES_PASSWORD) \
		-e POSTGRES_DB=$(POSTGRES_DB) \
		-e POSTGRES_HOST=localhost \
		-e POSTGRES_PORT=$(POSTGRES_PORT) \
		$(BACKEND_IMAGE)
else
	@echo "Starting backend container with default SQLite configuration"
	docker run -d \
		--name $(BACKEND_CONTAINER) \
		-p $(BACKEND_PORT):3002 \
		$(BACKEND_IMAGE)
endif

build-run-backend: build-backend run-backend

stop-backend:
	-docker stop $(BACKEND_CONTAINER)
	-docker rm -f $(BACKEND_CONTAINER)
	@echo "Stopped and removed backend container"

# Clean up ports and containers
cleanup-ports:
	@echo "Cleaning up ports and containers..."
	@echo "Checking for processes using ports $(FRONTEND_PORT) and $(BACKEND_PORT)..."
	-@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(FRONTEND_PORT)') do @taskkill /F /PID %%a 2>NUL || echo "No process on $(FRONTEND_PORT)"
	-@for /f "tokens=5" %%a in ('netstat -aon ^| findstr :$(BACKEND_PORT)') do @taskkill /F /PID %%a 2>NUL || echo "No process on $(BACKEND_PORT)"
	@timeout /t 2 /nobreak > NUL
	@echo "Ports cleanup completed"

# === Run Frontend ===
run-frontend:
	-docker stop $(FRONTEND_CONTAINER)
	-docker rm -f $(FRONTEND_CONTAINER)
	docker run -d \
		--name $(FRONTEND_CONTAINER) \
		-e BACKEND_URL=$(RUNTIME_BACKEND_URL) \
		-p $(FRONTEND_PORT):80 \
		$(FRONTEND_IMAGE)

build-run-frontend: build-frontend run-frontend

stop-frontend:
	-docker stop $(FRONTEND_CONTAINER)
	-docker rm -f $(FRONTEND_CONTAINER)

# === Logs ===
# Follow frontend container logs (use CTRL+C to stop)
logs-frontend:
	@echo "Starting continuous log stream for container: $(FRONTEND_CONTAINER)"
	@cmd /k "docker logs --tail 200 -f $(FRONTEND_CONTAINER) || pause"

# Follow backend container logs (use CTRL+C to stop)
logs-backend:
	@echo "Starting continuous log stream for container: $(BACKEND_CONTAINER)"
	@cmd /k "docker logs --tail 200 -f $(BACKEND_CONTAINER) || pause"

# Follow both frontend and backend logs in split windows
logs-all:
	@echo "Opening persistent terminal windows for logs..."
	@start "Frontend Logs" cmd /k "docker logs --tail 200 -f $(FRONTEND_CONTAINER) || pause"
	@start "Backend Logs" cmd /k "docker logs --tail 200 -f $(BACKEND_CONTAINER) || pause"

run-all: cleanup-ports run-backend run-frontend

stop-all: stop-backend stop-frontend

# Clean and run everything
clean-run-all: stop-all cleanup-ports run-all

# Build and run both frontend and backend
build-run-all: build-all run-all

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

build-run-backend-postgres: build-backend run-backend-postgres

# Recreate PostgreSQL container (fresh start)
postgres-recreate: postgres-down postgres-up
	@echo "🔁 Recreated PostgreSQL local dev container successfully."


# === Azure Container Registry (ACR) ===

# Azure & ACR Settings
AZURE_RESOURCE_GROUP ?= sidhu-textiles-rg
ACR_NAME ?= sidhutextilescontainerregistry
ACR_LOGIN_SERVER := $(ACR_NAME).azurecr.io
AZURE_VERSION := 0.0.1

# Full image names for ACR
ACR_FRONTEND_IMAGE := $(ACR_LOGIN_SERVER)/$(FRONTEND_IMAGE_NAME):$(AZURE_VERSION)
ACR_BACKEND_IMAGE := $(ACR_LOGIN_SERVER)/$(BACKEND_IMAGE_NAME):$(AZURE_VERSION)

# Login to Azure and ACR
azure-login:
	az login

acr-login:
	az acr login --name $(ACR_NAME)

# Build local images for ACR
build-acr-backend:
	cd backend && docker build --no-cache -t $(ACR_BACKEND_IMAGE) .

build-acr-frontend:
	cd frontend && docker build --no-cache -t $(ACR_FRONTEND_IMAGE) .

build-acr-all: build-acr-backend build-acr-frontend

# Push images to ACR
push-acr-backend:
	docker push $(ACR_BACKEND_IMAGE)

push-acr-frontend:
	docker push $(ACR_FRONTEND_IMAGE)

# Build and push both
push-acr-all: push-acr-frontend push-acr-backend

build-push-acr-all: build-acr-backend push-acr-backend build-acr-frontend push-acr-frontend
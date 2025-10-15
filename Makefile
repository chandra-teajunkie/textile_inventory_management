# Project Variables
VERSION ?= latest  # Default to 'latest' unless overridden
NAMESPACE := default
# === Build Docker Images ===
build-all:
	docker build -t textile-inventory-management-backend:$(VERSION) -f backend/Dockerfile .
	docker build -t textile-inventory-management-frontend:$(VERSION) -f frontend/Dockerfile .

build-backend:
	docker build -t textile-inventory-management-backend:$(VERSION) -f backend/Dockerfile .

build-frontend:
	docker build -t textile-inventory-management-frontend:$(VERSION) -f frontend/Dockerfile .

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

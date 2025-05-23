# Project Variables
VERSION ?= latest  # Default to 'latest' unless overridden

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
k8s-restart: k8s-delete k8s-deploy

repeat-backend: k8s-delete build-backend k8s-deploy
repeat-frontend: k8s-delete build-frontend k8s-deploy
repeat-all: k8s-delete build-all k8s-deploy

# === Clean Up Docker ===
docker-clean:
	docker image prune -a -f

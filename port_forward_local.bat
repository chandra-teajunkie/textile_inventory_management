start "Backend Port Forward" cmd /k kubectl port-forward svc/sidhu-textiles-app-backend 3002:3002

start "Frontend Port Forward" cmd /k kubectl port-forward svc/sidhu-textiles-app-frontend 3000:3000

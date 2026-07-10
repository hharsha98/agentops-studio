# Local Kubernetes

Use `k3d` to practice Kubernetes before spending AWS or GCP credits.

```bash
k3d cluster create agentops-studio --port "3000:80@loadbalancer"
kubectl apply -f ../base/namespace.yaml
kubectl create secret generic agentops-secrets \
  --namespace agentops-studio \
  --from-literal=database-url=postgresql+psycopg://agentops:agentops@host.k3d.internal:5432/agentops \
  --from-literal=redis-url=redis://host.k3d.internal:6379/0 \
  --from-literal=model-base-url=http://host.k3d.internal:3001/v1 \
  --from-literal=model-api-key=replace_me
kubectl apply -f ../base
kubectl get pods -n agentops-studio
```

The API and worker use the same container image. The API serves HTTP traffic, while the worker consumes Redis jobs and writes durable status to Postgres. For local k3d practice, the database and Redis URLs above connect to services exposed by Docker Compose on the host.

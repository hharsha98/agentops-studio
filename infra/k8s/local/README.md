# Local Kubernetes

Use `k3d` to practice Kubernetes before spending AWS or GCP credits.

```bash
k3d cluster create agentops-studio --port "3000:80@loadbalancer"
kubectl apply -f ../base/namespace.yaml
kubectl create secret generic agentops-secrets \
  --namespace agentops-studio \
  --from-literal=model-base-url=http://host.k3d.internal:3001/v1 \
  --from-literal=model-api-key=replace_me
kubectl apply -f ../base
kubectl get pods -n agentops-studio
```

These manifests are intentionally small at scaffold time. They will grow after Docker images and the backend services are stable.


# Portable Deployment Strategy

## Why Local First

Local Docker and local Kubernetes help separate application issues from infrastructure issues. This reduces infrastructure spend and makes the deployment path easier to operate.

## Managed Kubernetes Validation

Managed Kubernetes is useful for production-style validation because it exercises real ingress, secrets, logs, autoscaling, storage, and managed service integrations. Temporary environments should be created with Terraform and destroyed when validation is complete.

## Portable Hosting

The application should stay portable across providers. Kubernetes manifests describe the app, while provider-specific Terraform modules describe the managed cluster, database, cache, storage, logging, and secrets.

## Operational Focus

The project is intentionally provider-portable. The operational focus is packaging services as containers, running them as deployments, exposing them with services and ingress, managing secrets, observing logs, and controlling cost.

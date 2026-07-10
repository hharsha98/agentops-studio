# GCP GKE Deployment Plan

Use GCP after the AWS interview deployment window for longer hosting.

Target services:

- GKE for Kubernetes.
- Cloud SQL Postgres for app data.
- Memorystore Redis for queues/cache.
- Cloud Storage for artifacts.
- Secret Manager for secrets.
- Cloud Logging for logs.
- GKE ingress for public access.
- Self-hosted Langfuse on GKE or external Langfuse Cloud.

Migration idea:

The application runs on Kubernetes in both clouds. Cloud-specific differences should stay in Terraform and secrets, while app manifests stay as portable as possible.


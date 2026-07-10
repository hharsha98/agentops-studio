# AWS EKS Deployment Plan

Deploy to AWS only when interview calls start.

Target services:

- EKS for Kubernetes.
- RDS Postgres for app data and pgvector.
- ElastiCache Redis for queues/cache.
- S3 for artifacts.
- Secrets Manager for secrets.
- CloudWatch for logs.
- AWS Load Balancer Controller for ingress.
- Self-hosted Langfuse on EKS.

Cost warning:

EKS has an hourly control-plane cost even when the app is idle. Keep AWS live for about 7-14 days, record proof, then fully destroy the cluster and related resources.

Teardown checklist:

1. Delete Kubernetes ingress/load balancers.
2. Destroy Terraform resources.
3. Confirm EKS cluster is gone.
4. Confirm RDS, ElastiCache, NAT gateways, load balancers, EBS volumes, and S3 test buckets are deleted or intentionally retained.
5. Check AWS Billing Cost Explorer the next day.


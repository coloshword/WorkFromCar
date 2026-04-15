### Terraform

main.tf 
- entry point / bootstrapping config -- what does terraform need?

variables.tf
- declares the variables names needed 

ecr.tf:
- ECR --> aws's docker image resigstry -- the place where you store and version docker images
- gha builds code into docker image
- gha pushes that image to ECR (ecr stores the docker images)
- EC2 pulls image from ECR

---

### Production Outputs (from terraform apply)

| Resource | Value |
|----------|-------|
| EC2 Public IP | `13.221.130.176` |
| ECR Repository URL | `123185598678.dkr.ecr.us-east-1.amazonaws.com/work-from-car-server` |
| GHA Role ARN | `arn:aws:iam::123185598678:role/work-from-car-github-actions` |
| RDS Endpoint | `work-from-car-db.coviyuyi2ik6.us-east-1.rds.amazonaws.com:5432` |
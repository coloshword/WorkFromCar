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
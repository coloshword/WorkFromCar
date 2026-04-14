output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value = aws_instance.server.public_ip
}

output "rds_endpoint" {
  description = "RDS connection endpoint"
  value = aws_db_instance.postgres.endpoint
}

output "ecr_repository_url" {
  description = "ECR repository URl for Docker push/pull"
  value = aws_ecr_repository.server.repository_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN to use in GitHub Actions OIDC config"
  value = aws_iam_role.github_actions.arn
}

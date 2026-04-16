variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to"
  type = string
  default = "us-east-1"
}

variable "project_name" {
  description = "Used to name and tag resources"
  type = string
  default = "work-from-car"
}

variable "api_domain" {
  description = "Public domain name served by Caddy for the API"
  type = string
  default = "api.workfromcar.xyz"
}

variable "db_password" {
  description = "Master password for RDS"
  type = string
  sensitive = true
}

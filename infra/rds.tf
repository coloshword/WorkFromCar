resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-db"
  engine = "postgres"
  engine_version = "15"
  instance_class = "db.t3.micro"
  allocated_storage = 20

  db_name = "workfromcar"
  username = "postgres"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible = false
  skip_final_snapshot = true

  tags = {
    Project = var.project_name
  }
}

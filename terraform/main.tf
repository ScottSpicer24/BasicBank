terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ──────────────────────────────────────────────
# SSH Key Pair
# ──────────────────────────────────────────────

resource "tls_private_key" "this" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "this" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.this.public_key_openssh

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.this.private_key_pem
  filename        = "${path.module}/ssh-keys/${var.project_name}-key.pem"
  file_permission = "0400"
}

# ──────────────────────────────────────────────
# Security Group
# ──────────────────────────────────────────────

resource "aws_security_group" "this" {
  name        = "${var.project_name}-sg"
  description = "Security group for ${var.project_name}"

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "fastapi" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 8000
  to_port           = 8000
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "mongodb" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 27017
  to_port           = 27017
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.this.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ──────────────────────────────────────────────
# AMI Data Source — Ubuntu 22.04 LTS
# ──────────────────────────────────────────────

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ──────────────────────────────────────────────
# EC2 Instance
# ──────────────────────────────────────────────

resource "aws_instance" "this" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.this.id]

  user_data = <<-USERDATA
#!/bin/bash
set -e

# ── System packages ──
apt-get update -y
apt-get install -y python3 python3-pip python3-venv git nginx curl gnupg

# ── MongoDB 7.0 (official repo for Ubuntu 22.04 / Jammy) ──
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -y
apt-get install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# ── Clone repository ──
git clone ${var.github_repo_url} /home/ubuntu/app
chown -R ubuntu:ubuntu /home/ubuntu/app

# ── Python virtual environment & dependencies ──
cd /home/ubuntu/app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# ── .env file ──
cat > /home/ubuntu/app/backend/.env <<'ENVBLOCK'
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=${var.mongo_db_name}
JWT_SECRET_KEY=${var.jwt_secret_key}
JWT_ALGORITHM=${var.jwt_algorithm}
ENVBLOCK

chown ubuntu:ubuntu /home/ubuntu/app/backend/.env

# ── systemd service for FastAPI ──
cat > /etc/systemd/system/fastapi.service <<'SERVICEBLOCK'
[Unit]
Description=FastAPI Application
After=network.target mongod.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/backend
EnvironmentFile=/home/ubuntu/app/backend/.env
ExecStart=/home/ubuntu/app/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEBLOCK

systemctl daemon-reload
systemctl enable fastapi
systemctl start fastapi

# ── Nginx reverse proxy ──
cat > /etc/nginx/sites-available/fastapi <<'NGINXBLOCK'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXBLOCK

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/fastapi /etc/nginx/sites-enabled/fastapi
systemctl restart nginx
USERDATA

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

# ──────────────────────────────────────────────
# S3 Bucket (Frontend Hosting)
# ──────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${var.s3_bucket_suffix}"
  force_destroy = true

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# ──────────────────────────────────────────────
# CloudFront Origin Access Control (OAC)
# ──────────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ──────────────────────────────────────────────
# CloudFront Distribution
# ──────────────────────────────────────────────

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  # S3 origin (frontend)
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  # EC2 origin (API)
  origin {
    domain_name = aws_instance.this.public_dns
    origin_id   = "ec2-api-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior → S3
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  # Ordered cache behavior → EC2 API (/api/*)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ec2-api-origin"
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]

      cookies {
        forward = "all"
      }
    }
  }

  # SPA error handling
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  depends_on = [aws_instance.this]

  tags = {
    Name    = var.project_name
    Project = var.project_name
  }
}

# ──────────────────────────────────────────────
# S3 Bucket Policy — CloudFront access only
# ──────────────────────────────────────────────

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.this.arn
          }
        }
      }
    ]
  })
}

## Background
I have already created a `variables.tf` file with finalized variable names and default values for my project.

Your task is to create a **complete and production-ready `main.tf` file** inside the `infrastructure/` folder.

🚨 **DO NOT modify `variables.tf` under any circumstances.**
🚨 Only generate `main.tf` and `output.tf`.

---

## Requirements

### 1. Providers
Configure the following providers:

- `hashicorp/aws` version `~> 5.0`
- `hashicorp/tls` version `~> 4.0`
- `hashicorp/local` version `~> 2.0`

Use:
- `var.aws_region` for AWS region

---

### 2. SSH Key Pair

Create:

- `tls_private_key` (RSA, 4096 bits)
- `aws_key_pair` named:
  ```
  "${var.project_name}-key"
  ```

- Save private key using:
  - `local_sensitive_file`
  - Path:
    ```
    ${path.module}/ssh-keys/${var.project_name}-key.pem
    ```
  - File permission: `0400`

---

### 3. Security Group

Create a security group with:

#### Inbound rules (0.0.0.0/0):
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 8000 (FastAPI)
- 27017 (MongoDB)

#### Outbound:
- Allow all traffic using `aws_vpc_security_group_egress_rule`

---

### 4. AMI Data Source

Use a data source to fetch:

- Latest Ubuntu **22.04 LTS**
- HVM, SSD
- Owner:
  ```
  099720109477
  ```

---

### 5. EC2 Instance

Create an EC2 instance with:

- Instance type: `var.instance_type`
- Attach:
  - Security group
  - Key pair

#### User Data Script

The EC2 instance must bootstrap the following:

##### System Setup
- Install:
  - Python 3
  - pip
  - venv
  - git
  - nginx
  - curl
  - gnupg

##### MongoDB
- Install MongoDB **7.0 (official repo for Ubuntu 22.04 / Jammy)**
- Enable and start `mongod`

##### Application Setup
- Clone repo:
  ```
  var.github_repo_url → /home/ubuntu/app
  ```

- Create virtual environment:
  ```
  /home/ubuntu/app/backend
  ```

- Install dependencies:
  ```
  pip install -r requirements.txt
  ```

##### Environment File
Create `.env` file with:

```
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=${var.mongo_db_name}
JWT_SECRET_KEY=${var.jwt_secret_key}
JWT_ALGORITHM=${var.jwt_algorithm}
```

##### Systemd Service
Create and enable a `fastapi.service`:

- Runs:
  ```
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
- Uses `.env` via `EnvironmentFile`

##### Nginx
- Reverse proxy:
  ```
  port 80 → http://127.0.0.1:8000
  ```
- Remove default site
- Enable new config
- Restart nginx

---

### 6. S3 Bucket (Frontend Hosting)

Create an S3 bucket:

- Name:
  ```
  "${var.project_name}-frontend-${var.s3_bucket_suffix}"
  ```
- `force_destroy = true`
- Enable versioning
- Block ALL public access

#### Website Hosting
- index document: `index.html`
- error document: `index.html`

---

### 7. CloudFront Origin Access Control (OAC)

Create:

- `aws_cloudfront_origin_access_control`
- Config:
  - Signing: `sigv4`
  - Behavior: `always`
  - Origin type: S3

---

### 8. CloudFront Distribution

Configure:

- `PriceClass_All`
- Default root object: `index.html`

#### Origin
- Use S3 **regional domain name**
- Attach OAC

#### Default Cache Behavior
- Allowed methods: `GET`, `HEAD`
- Redirect HTTP → HTTPS
- Enable compression
- No cookies
- No query strings
- TTL:
  - min: 0
  - default: 3600
  - max: 86400

#### Custom Error Responses (SPA support)
- 403 → return 200 `/index.html`
- 404 → return 200 `/index.html`

---

### 9. S3 Bucket Policy

Allow:

- Principal: `cloudfront.amazonaws.com`
- Action: `s3:GetObject`
- Condition:
  ```
  AWS:SourceArn = CloudFront Distribution ARN
  ```

---

### 10. Tagging

ALL resources must include tags:

```
Name    = var.project_name
Project = var.project_name
```
---
---

## 8.1 CloudFront EC2 Origin + API Behavior (ADDITIONAL REQUIREMENT)

Extend the CloudFront distribution to include an additional origin pointing to the EC2 instance and a behavior for API routing.

### EC2 Origin

Create a CloudFront origin for the EC2 instance:

- Origin domain:
  - Use the EC2 instance **public DNS**
- Protocol:
  - HTTP only (CloudFront → EC2)
- Name the origin clearly (e.g., `ec2-api-origin`)

---

### API Cache Behavior

Add an **ordered cache behavior** with the following configuration:

#### Path Pattern
```
/api/*
```

#### Target Origin
- Must route to the **EC2 origin**

#### Allowed Methods
- `GET`
- `HEAD`
- `OPTIONS`
- `PUT`
- `POST`
- `PATCH`
- `DELETE`

#### Viewer Protocol Policy
- `redirect-to-https`

---

### Headers / Forwarding Rules

You MUST configure this behavior to support authenticated API requests:

- Forward the following headers:
  - `Authorization`
  - `Content-Type`

- Forward:
  - All query strings
  - All cookies

⚠️ Do NOT cache authenticated responses incorrectly:
- Set caching to effectively disabled for this behavior:
  - `min_ttl = 0`
  - `default_ttl = 0`
  - `max_ttl = 0`

---

### Important Notes

- This behavior must take priority over the default S3 behavior
- Ensure no conflicts with the existing default behavior
- Do NOT modify the existing S3 origin or SPA routing setup
- Ensure Terraform dependencies are correctly wired (EC2 must exist before distribution)

---


---

## Implementation Rules

- Use **Terraform best practices**
- Use **separate resources (not inline blocks)** where appropriate
- Use **explicit dependencies** where required
- Use **clear and consistent naming**
- Avoid deprecated Terraform syntax
- Ensure the file is fully runnable with `terraform init` and `terraform apply`

---

## Output Format

1. First, briefly list all resources that will be created
2. Then generate the **complete `main.tf` file**
3. Do not include explanations after the code

🚨 Output ONLY what is requested
🚨 Do NOT modify or recreate `variables.tf`
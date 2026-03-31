output "ec2_public_ip" {
  description = "Public IP address of the backend EC2 instance"
  value       = aws_instance.this.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS of the backend EC2 instance"
  value       = aws_instance.this.public_dns
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for cache invalidation)"
  value       = aws_cloudfront_distribution.this.id
}

output "ssh_private_key_path" {
  description = "Path to the generated SSH private key"
  value       = local_sensitive_file.private_key.filename
}

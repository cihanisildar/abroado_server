# ============================================
# SSL Certificate Generation Script
# ============================================
# This script generates self-signed certificates for local development.
# For production, replace the files in docker/gateway/certs with real ones.

$CertDir = Join-Path (Get-Location) "docker/gateway/certs"

# 1. Create directory if it doesn't exist
if (!(Test-Path $CertDir)) {
    New-Item -ItemType Directory -Force -Path $CertDir
    Write-Host "✅ Created directory: $CertDir" -ForegroundColor Green
}

# 2. Check if OpenSSL is installed
if (!(Get-Command openssl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ OpenSSL not found! Please install it or run this in a Git Bash terminal." -ForegroundColor Red
    exit
}

Write-Host "🔐 Generating self-signed SSL certificates..." -ForegroundColor Cyan

# 3. Generate private key and certificate
# We use 'localhost' as the common name for local testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout (Join-Path $CertDir "privkey.pem") `
    -out (Join-Path $CertDir "fullchain.pem") `
    -subj "/C=US/ST=State/L=City/O=Development/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSL Certificates generated successfully in $CertDir" -ForegroundColor Green
    Write-Host "   - privkey.pem"
    Write-Host "   - fullchain.pem"
    Write-Host ""
    Write-Host "🚀 You can now restart your containers with: docker-compose up -d --build gateway" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to generate certificates." -ForegroundColor Red
}

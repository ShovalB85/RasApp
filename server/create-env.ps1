# Script to create .env file in the server directory
# Run this from the server folder

Write-Host "=== Creating .env File ===" -ForegroundColor Cyan
Write-Host ""

$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Green
Write-Host ""

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠ .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled. .env file not changed." -ForegroundColor Yellow
        exit 0
    }
}

# Get PostgreSQL password
Write-Host "Enter your PostgreSQL password for user 'postgres':" -ForegroundColor Cyan
$pgPassword = Read-Host -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

# Generate random JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Create .env content
$envContent = @"
DATABASE_URL="postgresql://postgres:$pgPasswordPlain@localhost:5432/rasapp?schema=public"
JWT_SECRET="$jwtSecret"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
"@

# Write to file
$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $currentDir\.env" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify the file: Get-Content .env" -ForegroundColor White
Write-Host "  2. Run: npm install" -ForegroundColor White
Write-Host "  3. Run: npm run db:generate" -ForegroundColor White
Write-Host "  4. Run: npm run db:migrate" -ForegroundColor White
Write-Host "  5. Run: npm run db:seed" -ForegroundColor White
Write-Host ""


# Quick script to create RasApp database in PostgreSQL 18
# Run this in PowerShell

Write-Host "=== Creating RasApp Database (PostgreSQL 18) ===" -ForegroundColor Cyan
Write-Host ""

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Check if PostgreSQL 18 exists
if (-not (Test-Path $psqlPath)) {
    Write-Host "❌ PostgreSQL 18 not found at: $psqlPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking other versions..." -ForegroundColor Yellow
    
    # Try other common versions
    $versions = @(18, 17, 16, 15, 14)
    $found = $false
    
    foreach ($version in $versions) {
        $testPath = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
        if (Test-Path $testPath) {
            $psqlPath = $testPath
            Write-Host "✓ Found PostgreSQL $version at: $testPath" -ForegroundColor Green
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "❌ Could not find PostgreSQL installation" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install PostgreSQL 18 or specify the path manually." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Using: $psqlPath" -ForegroundColor Green
Write-Host ""

# Get PostgreSQL password
$password = Read-Host "Enter your PostgreSQL password for user 'postgres'"

# Create database
Write-Host "Creating database 'rasapp'..." -ForegroundColor Yellow

$env:PGPASSWORD = $password
$createDbCommand = "CREATE DATABASE rasapp;"

& $psqlPath -U postgres -c $createDbCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database 'rasapp' created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Create .env file in server/ folder" -ForegroundColor White
    Write-Host "  2. Run: npm install (in server/ folder)" -ForegroundColor White
    Write-Host "  3. Run: npm run db:generate" -ForegroundColor White
    Write-Host "  4. Run: npm run db:migrate" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host "Check your password and PostgreSQL installation" -ForegroundColor Yellow
    exit 1
}

# Clear password from environment
Remove-Item Env:PGPASSWORD


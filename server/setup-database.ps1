# RasApp Database Setup Script for Windows
# This script helps you set up the database connection

Write-Host "`n=== RasApp Database Setup ===`n" -ForegroundColor Cyan

# Step 1: Check if .env exists
Write-Host "Step 1: Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    $envContent = Get-Content .env -Raw
    if ($envContent -match "YOUR_PASSWORD") {
        Write-Host "⚠ WARNING: .env file contains placeholder 'YOUR_PASSWORD'" -ForegroundColor Red
        Write-Host "  Please edit .env file and replace YOUR_PASSWORD with your PostgreSQL password" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file does NOT exist" -ForegroundColor Red
    Write-Host "`nCreating .env file template...`n" -ForegroundColor Yellow
    
    $pgPassword = Read-Host "Enter your PostgreSQL password"
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envTemplate = @"
DATABASE_URL="postgresql://postgres:$pgPassword@localhost:5432/rasapp?schema=public"
JWT_SECRET="$jwtSecret"
PORT=3001
HOST=0.0.0.0
CORS_ORIGINS="*"
"@
    
    $envTemplate | Out-File -FilePath .env -Encoding utf8 -NoNewline
    Write-Host "✓ .env file created!" -ForegroundColor Green
}

# Step 2: Check if node_modules exists
Write-Host "`nStep 2: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Dependencies NOT installed" -ForegroundColor Red
    $install = Read-Host "Install dependencies now? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
    }
}

# Step 3: Check if database exists
Write-Host "`nStep 3: Database setup instructions..." -ForegroundColor Yellow
Write-Host "`nTo create the database, run in PowerShell:" -ForegroundColor Cyan
Write-Host '  & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres' -ForegroundColor White
Write-Host "  Then run: CREATE DATABASE rasapp;" -ForegroundColor White
Write-Host "  Then run: \q" -ForegroundColor White

$dbExists = Read-Host "`nHas the 'rasapp' database been created? (y/n)"
if ($dbExists -ne "y" -and $dbExists -ne "Y") {
    Write-Host "`n⚠ Please create the database first before continuing" -ForegroundColor Yellow
    Write-Host "  See POSTGRESQL_CONNECTION_STEPS.md for detailed instructions`n" -ForegroundColor Yellow
    exit 0
}

# Step 4: Generate Prisma Client
Write-Host "`nStep 4: Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client generated!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host "  Check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}

# Step 5: Run migrations
Write-Host "`nStep 5: Running database migrations..." -ForegroundColor Yellow
npm run db:migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database migrations completed!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to run migrations" -ForegroundColor Red
    exit 1
}

# Step 6: Seed database
Write-Host "`nStep 6: Seeding database with initial data..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to seed database" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Start the server: npm run dev" -ForegroundColor White
Write-Host "  2. Test connection: curl http://localhost:3001/health" -ForegroundColor White
Write-Host "`nDefault admin account:" -ForegroundColor Cyan
Write-Host "  Personal ID: 8223283" -ForegroundColor White
Write-Host "  Password: P)O(I*q1w2e3" -ForegroundColor White
Write-Host ""


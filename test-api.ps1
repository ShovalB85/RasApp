# Test API Connection Script
Write-Host "`n=== Testing RasApp API ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Server is running!" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Server is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Solution: Start the server with: cd server && npm run dev" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Test 2: Check root endpoint
Write-Host "2. Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Root endpoint works!" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($json.message)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Root endpoint failed!" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test login endpoint (without auth)
Write-Host "3. Testing login endpoint..." -ForegroundColor Yellow
try {
    $body = @{
        personalId = "8223283"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
    Write-Host "   ✅ Login endpoint works!" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    if ($json.needsPassword) {
        Write-Host "   Response: User needs to set password" -ForegroundColor Gray
    } elseif ($json.token) {
        Write-Host "   Response: Login successful" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Login endpoint failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Check database connection
Write-Host "4. Testing database connection..." -ForegroundColor Yellow
Write-Host "   (This requires checking server logs)" -ForegroundColor Gray
Write-Host "   Look for database connection errors in server console" -ForegroundColor Gray

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check if API mode is enabled in frontend" -ForegroundColor White
Write-Host "  2. Check browser console (F12) for errors" -ForegroundColor White
Write-Host "  3. Check server console for errors" -ForegroundColor White


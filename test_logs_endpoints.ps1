$json_registration = @{
    candidateId = "test-candidate-123"
    eventType = "credential_generated"
    details = @{
        credentialId = "cred-456"
        credentialType = "professional_certificate"
    }
} | ConvertTo-Json -Depth 10

Write-Host "Testing POST /api/logs/registration endpoint..."

try {
    $response = Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/logs/registration" `
        -Method POST `
        -ContentType "application/json" `
        -Body $json_registration `
        -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__ 
    Write-Host "ERROR: Status $statusCode"
    Write-Host "Exception: $($_.Exception.Message)"
}

$json_admin = @{
    adminId = "admin-789"
    action = "payment_approved"
    candidateId = "test-candidate-123"
    details = @{
        paymentAmount = 50000
        paymentStatus = "approved"
    }
} | ConvertTo-Json -Depth 10

Write-Host "`nTesting POST /api/logs/admin-actions endpoint..."

try {
    $response = Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/logs/admin-actions" `
        -Method POST `
        -ContentType "application/json" `
        -Body $json_admin `
        -TimeoutSec 30
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "ERROR: Status $statusCode"  
    Write-Host "Exception: $($_.Exception.Message)"
}

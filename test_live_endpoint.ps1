$json = @{
    email = "kagiageorge00@gmail.com"
    phoneNumber = "+254708715024"
    name = "Test User"
    channels = @("email", "whatsapp", "push")
    title = "Test Notification"
    body = "This is a test notification"
    data = @{ testKey = "testValue" }
} | ConvertTo-Json -Depth 10

Write-Host "Sending request to live endpoint..."

try {
    $response = Invoke-WebRequest -Uri "https://backened-server-1.onrender.com/api/notifications/send" `
        -Method POST `
        -ContentType "application/json" `
        -Body $json `
        -TimeoutSec 120
    Write-Host "SUCCESS: Status $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "ERROR: Status $statusCode"
    Write-Host "Exception: $($_.Exception.Message)"
    
    if ($_.Exception.Response -ne $null) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $body_response = $reader.ReadToEnd()
            Write-Host "Response Body: $body_response"
            $reader.Close()
        } catch {
            Write-Host "Could not read response body"
        }
    }
}

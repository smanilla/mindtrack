$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjgzOTIwODdkNWE5OWNmNWVjYzc5OSIsImlhdCI6MTc2NDY4NzIzMCwiZXhwIjoxNzY1MjkyMDMwfQ.yhRr-SnD8GoGtVBlImyskFlpFDw-pUOE3rLoaNXb0qM"
$filePath = "D:\codes\final year project\mindtrack\public\red-alert-voice-bangla.mp3"
$url = "https://mindtrack-gamma.vercel.app/api/upload/audio"

$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"audio`"; filename=`"$fileName`"",
    "Content-Type: audio/mpeg",
    "",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"
$bodyBytes = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body)

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $bodyBytes
    Write-Host "Success! Public URL: $($response.publicUrl)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copy this URL and add it to Vercel environment variable RED_ALERT_VOICE_AUDIO_URL" -ForegroundColor Yellow
    Write-Host $response.publicUrl
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}


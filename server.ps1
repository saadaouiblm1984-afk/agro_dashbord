# Simple HTTP Server with API Support
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "🚀 Server started at http://localhost:8080"
Write-Host "📊 Dashboard: http://localhost:8080"
Write-Host "🌟 Press Ctrl+C to stop"

function Get-ContentType($path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    switch ($ext) {
        ".html" { "text/html; charset=utf-8" }
        ".css" { "text/css" }
        ".js" { "application/javascript" }
        ".json" { "application/json" }
        ".png" { "image/png" }
        ".jpg" { "image/jpeg" }
        ".gif" { "image/gif" }
        ".ico" { "image/x-icon" }
        default { "text/plain" }
    }
}

function Send-Response($context, $content, $contentType = "text/html", $statusCode = 200) {
    $response = $context.Response
    $response.StatusCode = $statusCode
    $response.ContentType = $contentType
    
    if ($content -is [string]) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
    } elseif ($content -is [byte[]]) {
        $buffer = $content
    } else {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content.ToString())
    }
    
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
}

function Get-ApiData($endpoint) {
    $apiFile = Join-Path (Get-Location) "api\admin\api\$endpoint.json"
    if (Test-Path $apiFile) {
        return Get-Content $apiFile -Raw
    }
    return $null
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.LocalPath
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $path"
        
        try {
            # Handle API endpoints
            if ($path.StartsWith("/admin/api/")) {
                $endpoint = $path.Substring("/admin/api/".Length)
                $data = Get-ApiData $endpoint
                
                if ($data) {
                    Send-Response $context $data "application/json"
                } else {
                    $errorData = '{"error": "Endpoint not found"}'
                    Send-Response $context $errorData "application/json" 404
                }
            }
            # Handle root path
            elseif ($path -eq "/" -or $path -eq "") {
                $indexPath = Join-Path (Get-Location) "index.html"
                if (Test-Path $indexPath) {
                    $content = Get-Content $indexPath -Raw -Encoding UTF8
                    Send-Response $context $content "text/html; charset=utf-8"
                } else {
                    Send-Response $context "File not found" "text/plain" 404
                }
            }
            # Handle static files
            else {
                $filePath = Join-Path (Get-Location) ($path.TrimStart('/'))
                if (Test-Path $filePath -PathType Leaf) {
                    $contentType = Get-ContentType $filePath
                    if ($contentType.StartsWith("text/") -or $contentType -eq "application/javascript") {
                        $content = Get-Content $filePath -Raw -Encoding UTF8
                        Send-Response $context $content $contentType
                    } else {
                        $content = [System.IO.File]::ReadAllBytes($filePath)
                        Send-Response $context $content $contentType
                    }
                } else {
                    Send-Response $context "File not found" "text/plain" 404
                }
            }
        }
        catch {
            Write-Host "Error handling request: $_"
            Send-Response $context "Internal server error" "text/plain" 500
        }
    }
}
finally {
    $listener.Stop()
    Write-Host "Server stopped"
}

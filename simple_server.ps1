# Simple HTTP Server with API Support
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server started at http://localhost:8080"

function Send-Response($context, $content, $contentType = "text/html", $statusCode = 200) {
    $response = $context.Response
    $response.StatusCode = $statusCode
    $response.ContentType = $contentType
    
    if ($content -is [string]) {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
    } else {
        $buffer = $content
    }
    
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.Close()
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $path = $request.Url.LocalPath
        
        try {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Request: $path"
            
            # Handle API endpoints
            if ($path.StartsWith("/admin/api/")) {
                $endpoint = $path.Substring("/admin/api/".Length)
                $apiFile = Join-Path (Get-Location) "api\admin\api\$endpoint.json"
                
                if (Test-Path $apiFile) {
                    $data = Get-Content $apiFile -Raw
                    Send-Response $context $data "application/json"
                } else {
                    Send-Response $context '{"error": "Endpoint not found"}' "application/json" 404
                }
            }
            # Handle root path
            elseif ($path -eq "/" -or $path -eq "") {
                $indexPath = Join-Path (Get-Location) "index.html"
                if (Test-Path $indexPath) {
                    $content = Get-Content $indexPath -Raw -Encoding UTF8
                    Send-Response $context $content "text/html"
                } else {
                    Send-Response $context "File not found" "text/plain" 404
                }
            }
            # Handle static files
            else {
                $filePath = Join-Path (Get-Location) ($path.TrimStart('/'))
                if (Test-Path $filePath -PathType Leaf) {
                    $content = Get-Content $filePath -Raw -Encoding UTF8
                    $contentType = "text/plain"
                    if ($filePath.EndsWith(".html")) { $contentType = "text/html" }
                    elseif ($filePath.EndsWith(".css")) { $contentType = "text/css" }
                    elseif ($filePath.EndsWith(".js")) { $contentType = "application/javascript" }
                    elseif ($filePath.EndsWith(".json")) { $contentType = "application/json" }
                    Send-Response $context $content $contentType
                } else {
                    Send-Response $context "File not found" "text/plain" 404
                }
            }
        }
        catch {
            Send-Response $context "Internal server error" "text/plain" 500
        }
    }
}
finally {
    $listener.Stop()
}

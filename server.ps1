$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8081/")
try {
    $listener.Start()
    Write-Host "Started HTTP server on http://localhost:8081/"
} catch {
    Write-Host "Failed to start server: $_"
    exit
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ($localPath -eq "") {
            $localPath = "index.html"
        }
        
        $filePath = Join-Path (Get-Location).Path $localPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            
            if ($filePath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            } elseif ($filePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript"
            } elseif ($filePath.EndsWith(".html")) {
                $response.ContentType = "text/html"
            }
            
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}

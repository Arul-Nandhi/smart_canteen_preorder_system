$historyPath = "C:\Users\Acer\AppData\Roaming\Code\User\History"
$projectRoot = "c:\users\acer\desktop\info\project\smart canteen portal"

$historyDirs = Get-ChildItem -Path $historyPath -Directory

$results = @()

foreach ($dir in $historyDirs) {
    $entriesFile = Join-Path $dir.FullName "entries.json"
    if (Test-Path $entriesFile) {
        try {
            $json = Get-Content $entriesFile -Raw | ConvertFrom-Json
            $resource = $json.resource
            $decodedPath = [System.Web.HttpUtility]::UrlDecode($resource)
            if ($decodedPath -like "file:///*") {
                $decodedPath = $decodedPath.Substring(8)
            }
            $decodedPath = $decodedPath -replace '/', '\'
            
            if ($decodedPath.ToLower().StartsWith($projectRoot)) {
                foreach ($entry in $json.entries) {
                    $results += [PSCustomObject]@{
                        Path = $decodedPath.Substring($projectRoot.Length + 1)
                        Timestamp = $entry.timestamp
                        Time = [DateTimeOffset]::FromUnixTimeMilliseconds($entry.timestamp).LocalDateTime.ToString("yyyy-MM-dd HH:mm:ss")
                    }
                }
            }
        } catch {}
    }
}

$results | Sort-Object Timestamp -Descending | Select-Object -First 60 | Format-Table -Property Time, Timestamp, Path -AutoSize

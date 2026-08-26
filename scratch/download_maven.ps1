$workspace = "c:\Users\harih\OneDrive\Desktop\cts_project (2) (4) (1)\cts_project (2) (4)\cts_project"
$binDir = Join-Path $workspace "bin"
$mavenZip = Join-Path $binDir "maven.zip"
$mavenDest = Join-Path $binDir "maven"

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

Write-Host "Downloading Maven..."
Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip" -OutFile $mavenZip

Write-Host "Extracting Maven..."
Expand-Archive -Path $mavenZip -DestinationPath $mavenDest -Force

Write-Host "Cleaning up zip..."
Remove-Item $mavenZip

Write-Host "Maven installed successfully at $mavenDest"

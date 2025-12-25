param(
  [Parameter(Mandatory=$true)] [string] $FilePath,
  [string] $SecretName = 'GOOGLE_SERVICE_ACCOUNT_JSON'
)

if (-not (Test-Path $FilePath)) {
  Write-Error "File not found: $FilePath"
  exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh (GitHub CLI) not found. Install from https://cli.github.com/"
  exit 1
}

$content = Get-Content -Raw -Path $FilePath
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$encoded = [Convert]::ToBase64String($bytes)

Write-Output "Uploading secret $SecretName to the current GitHub repo (requires gh auth)"
gh secret set $SecretName --body $encoded

Write-Output "Done. The secret $SecretName is set."

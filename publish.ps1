param(
  [string]$GitHubUser = "shpark-jason",
  [string]$Repository = "sunghyun",
  [string]$Message = "Replace portfolio with Astro site"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
$WorkRoot = Join-Path $ProjectRoot "work"
$DeployRoot = Join-Path $WorkRoot "github-deploy"
$RemoteUrl = "https://github.com/$GitHubUser/$Repository.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git이 설치되어 있지 않습니다. https://git-scm.com/download/win 에서 먼저 설치해 주세요."
}

New-Item -ItemType Directory -Force -Path $WorkRoot | Out-Null

if (Test-Path -LiteralPath $DeployRoot) {
  $ResolvedDeployRoot = [System.IO.Path]::GetFullPath($DeployRoot)
  $ResolvedWorkRoot = [System.IO.Path]::GetFullPath($WorkRoot)

  if (-not $ResolvedDeployRoot.StartsWith($ResolvedWorkRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "안전하지 않은 임시 경로로 판단되어 중단했습니다: $ResolvedDeployRoot"
  }

  Remove-Item -LiteralPath $ResolvedDeployRoot -Recurse -Force
}

Write-Host "GitHub 저장소를 준비하는 중..."
git clone $RemoteUrl $DeployRoot

Get-ChildItem -LiteralPath $DeployRoot -Force |
  Where-Object { $_.Name -ne ".git" } |
  Remove-Item -Recurse -Force

$ExcludedNames = @(
  ".git",
  ".astro",
  "node_modules",
  "dist",
  "work",
  "outputs"
)

Get-ChildItem -LiteralPath $ProjectRoot -Force |
  Where-Object { $ExcludedNames -notcontains $_.Name } |
  Copy-Item -Destination $DeployRoot -Recurse -Force

Set-Location -LiteralPath $DeployRoot
git add -A

$Changes = git status --porcelain
if (-not $Changes) {
  Write-Host "업로드할 새 변경사항이 없습니다."
  exit 0
}

git commit -m $Message
git push origin main

Write-Host ""
Write-Host "GitHub 업로드 완료"
Write-Host "저장소: https://github.com/$GitHubUser/$Repository"
Write-Host "사이트: https://$GitHubUser.github.io/$Repository/"

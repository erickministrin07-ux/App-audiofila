<#
.SYNOPSIS
  Crea (si no existe) un repo llamado "chiquinene" en tu cuenta de GitHub y empuja la carpeta actual.
.DESCRIPTION
  Usa un GitHub PAT con permiso de repo. Si no se proporciona, pide por consola.
.PARAMETER RepoName
  Nombre del repositorio en GitHub. Por defecto: "chiquinene".
.PARAMETER Private
  Si es verdadero, el repo será privado. Por defecto: $true.
.PARAMETER Token
  GitHub PAT con alcance repo. Si no se pasa, se toma de la variable de entorno GITHUB_TOKEN o se solicita.
.PARAMETER Username
  Usuario de GitHub. Si no se especifica, se detecta vía API usando el token.
#>

param(
  [string]$RepoName = "chiquinene",
  [bool]$Private = $true,
  [string]$Token = "",
  [string]$Username = ""
)

# 0) Requisitos
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git no está instalado. Instala Git y vuelve a intentarlo."
  exit 1
}

# 1) Token
if ([string]::IsNullOrWhiteSpace($Token)) {
  $Token = $env:GITHUB_TOKEN
}
if ([string]::IsNullOrWhiteSpace($Token)) {
  $Token = Read-Host -Prompt "GitHub Token (PAT) con acceso repo"
}
if ([string]::IsNullOrWhiteSpace($Token)) {
  Write-Error "Token no proporcionado. Abortando."
  exit 1
}

# 2) Username
if ([string]::IsNullOrWhiteSpace($Username)) {
  try {
    $u = Invoke-RestMethod -Method Get -Uri "https://api.github.com/user" -Headers @{Authorization="token $Token"; Accept="application/vnd.github+json"}
    $Username = $u.login
  } catch {
    Write-Error "No se pudo obtener el usuario de GitHub. Proporciona -Username."
    exit 1
  }
}
$RemoteUrl = "https://github.com/$Username/$RepoName.git"

# 3) Crear repo si no existe
try {
  Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$Username/$RepoName" -Headers @{Authorization="token $Token"; Accept="application/vnd.github+json"} -ErrorAction Stop | Out-Null
  Write-Host "Repositorio '$RepoName' ya existe en tu cuenta."
} catch {
  $payload = @{ name = $RepoName; private = $Private } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers @{Authorization="token $Token"; Accept="application/vnd.github+json"} -Body $payload
  Write-Host "Repositorio '$RepoName' creado."
}

# 4) Git operations
if (!(Test-Path ".git")) { git init }

git remote remove origin 2>$null || true
git remote add origin $RemoteUrl 2>$null || true
git fetch origin 2>$null || true
git checkout -B main 2>$null || (git branch -D main 2>$null; git checkout -B main)

$changes = (git status --porcelain)
if ($changes -ne "") {
  git add .
  git commit -m "standalone Audiofila: inicialización para push a $RepoName"
} else {
  Write-Host "No hay cambios para commitear."
}
git push -u origin main --force-with-lease
Write-Host "Listo. Revisa: https://github.com/$Username/$RepoName"

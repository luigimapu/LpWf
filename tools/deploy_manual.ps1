#requires -Version 5.1
param(
  [string]$Branch,
  [switch]$NoDb,
  [string]$Php
)

$ErrorActionPreference = 'Stop'

function Test-RemoteBranch([string]$b) {
  $out = git ls-remote --heads origin $b 2>$null
  return -not [string]::IsNullOrWhiteSpace($out)
}

$ScriptDir = Split-Path -Parent $PSCommandPath
$RootDir = Resolve-Path (Join-Path $ScriptDir '..')
Set-Location $RootDir

if (-not $Branch) {
  if (Test-RemoteBranch 'main') { $Branch = 'main' } else { $Branch = 'staging' }
}

if ($Php) {
  $PHP_BIN = $Php
} else {
  $phpCmd = Get-Command php -ErrorAction SilentlyContinue
  if ($phpCmd) {
    $PHP_BIN = $phpCmd.Source
  } elseif (Test-Path 'C:\\xampp\\php\\php.exe') {
    $PHP_BIN = 'C:\\xampp\\php\\php.exe'
  } elseif (Test-Path 'C:\\Program Files\\php\\php.exe') {
    $PHP_BIN = 'C:\\Program Files\\php\\php.exe'
  } elseif (Test-Path 'C:\\php\\php.exe') {
    $PHP_BIN = 'C:\\php\\php.exe'
  } else {
    throw "PHP non trovato nel PATH. Specifica --Php <path> o installa PHP."
  }
}

Write-Host "Repo: $RootDir"
Write-Host "Branch: $Branch"
Write-Host "PHP_BIN: $PHP_BIN"

if (-not (Test-Path '.env')) {
  Write-Warning ".env non trovato nella root. Gli script DB useranno i default."
}

Write-Host '== Git: fetch/prune =='
git fetch origin --prune

Write-Host "== Git: checkout $Branch =="
git show-ref --verify --quiet "refs/heads/$Branch"
$localExists = $LASTEXITCODE -eq 0
if ($localExists) {
  git checkout $Branch
} elseif (Test-RemoteBranch $Branch) {
  git checkout -B $Branch "origin/$Branch"
} else {
  throw "La branch '$Branch' non esiste su origin e non è presente localmente."
}

Write-Host '== Git: fast-forward pull =='
git pull --ff-only origin $Branch

if ($NoDb) {
  Write-Host '(skip) DB setup disattivato con --NoDb'
  exit 0
}

Write-Host '== DB setup: hub =='
& $PHP_BIN 'tools/setup_hub_db.php'

Write-Host '== DB setup: tenant =='
& $PHP_BIN 'tools/setup_tenant_db.php'

Write-Host 'OK: deploy manuale completato.'


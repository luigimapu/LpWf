#requires -Version 5.1
param(
  [switch]$HubOnly,
  [switch]$TenantOnly,
  [string]$Php
)

$ErrorActionPreference = 'Stop'

function Resolve-PhpPath([string]$PhpParam) {
  if ($PhpParam) { return $PhpParam }
  $cmd = Get-Command php -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $candidates = @(
    'C:\\xampp\\php\\php.exe',
    'C:\\Program Files\\php\\php.exe',
    'C:\\php\\php.exe'
  )
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  throw "PHP non trovato. Aggiungilo al PATH o usa -Php <path>"
}

$ScriptDir = Split-Path -Parent $PSCommandPath
$RootDir = Resolve-Path (Join-Path $ScriptDir '..')
$PHP_BIN = Resolve-PhpPath -PhpParam $Php

Write-Host "Root: $RootDir"
Write-Host "PHP : $PHP_BIN"

if (-not $HubOnly -and -not $TenantOnly) {
  $runHub = $true; $runTenant = $true
} else {
  $runHub = -not $TenantOnly
  $runTenant = -not $HubOnly
}

if ($runHub) {
  Write-Host '== Setup HUB =='
  & $PHP_BIN (Join-Path $RootDir 'tools/setup_hub_db.php')
}

if ($runTenant) {
  Write-Host '== Setup TENANT =='
  & $PHP_BIN (Join-Path $RootDir 'tools/setup_tenant_db.php')
}

Write-Host 'OK: setup completato.'


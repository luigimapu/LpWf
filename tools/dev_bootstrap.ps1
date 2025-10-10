#requires -Version 5.1
param(
  [switch]$RunSetup,
  [string]$Php,
  [switch]$SkipComposer,
  [switch]$SkipNode
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

function Ensure-Composer([string]$PHP_BIN) {
  if (Get-Command composer -ErrorAction SilentlyContinue) {
    Write-Host 'composer rilevato nel PATH'
    return 'composer'
  }
  Write-Host 'composer non trovato: installerò composer.phar locale in tools\'
  $sigUrl = 'https://composer.github.io/installer.sig'
  $instUrl = 'https://getcomposer.org/installer'
  $tmp = [IO.Path]::Combine($env:TEMP, 'composer-setup.php')
  $sig = (Invoke-RestMethod -Uri $sigUrl -UseBasicParsing).Trim()
  Invoke-WebRequest -Uri $instUrl -OutFile $tmp -UseBasicParsing
  $hash = (Get-FileHash -Algorithm SHA384 -Path $tmp).Hash.ToLower()
  if ($hash -ne $sig.ToLower()) {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    throw "Verifica firma installer Composer fallita"
  }
  $toolsDir = (Resolve-Path (Join-Path $PSScriptRoot '.')).Path
  & $PHP_BIN $tmp --install-dir $toolsDir --filename composer.phar | Write-Host
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  return (Join-Path $toolsDir 'composer.phar')
}

function Run-ComposerInstall([string]$ComposerCmd, [string]$PHP_BIN) {
  if ($ComposerCmd -eq 'composer') {
    & $ComposerCmd install
  } else {
    & $PHP_BIN $ComposerCmd install
  }
}

$RootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RootDir
$PHP_BIN = Resolve-PhpPath -PhpParam $Php
Write-Host "Root: $RootDir"
Write-Host "PHP : $PHP_BIN"

# Composer deps
if (-not $SkipComposer) {
  if (Test-Path 'composer.json') {
    $composerCmd = Ensure-Composer -PHP_BIN $PHP_BIN
    Write-Host '== Composer install =='
    Run-ComposerInstall -ComposerCmd $composerCmd -PHP_BIN $PHP_BIN
  } else {
    Write-Host 'composer.json non presente: salto Composer'
  }
} else {
  Write-Host '(skip) Composer disattivato con --SkipComposer'
}

# Node deps
if (-not $SkipNode) {
  if (Test-Path 'package-lock.json' -or Test-Path 'package.json') {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
      Write-Host '== npm deps =='
      if (Test-Path 'package-lock.json') { npm ci } else { npm install }
    } else {
      Write-Warning 'npm non trovato: salto installazione dipendenze JS'
    }
  }
} else {
  Write-Host '(skip) npm disattivato con --SkipNode'
}

# VS Code recommendations/settings
$vsDir = Join-Path $RootDir '.vscode'
New-Item -ItemType Directory -Path $vsDir -Force | Out-Null

$extensions = @{
  recommendations = @(
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'EditorConfig.EditorConfig',
    'bmewburn.vscode-intelephense-client',
    'xdebug.php-debug',
    'jebbs.plantuml'
  )
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $vsDir 'extensions.json') -Value $extensions -Encoding UTF8

$settings = @{
  'editor.formatOnSave' = $true
  'files.eol' = "\n"
  'intelephense.environment.phpVersion' = '8.3'
  '[php]' = @{ 'editor.tabSize' = 4 }
  '[javascript]' = @{ 'editor.tabSize' = 2 }
  '[html]' = @{ 'editor.tabSize' = 2 }
  '[css]' = @{ 'editor.tabSize' = 2 }
} | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $vsDir 'settings.json') -Value $settings -Encoding UTF8

Write-Host 'VS Code configurato (.vscode/extensions.json, .vscode/settings.json)'

if ($RunSetup) {
  Write-Host '== Eseguo setup DB (hub + tenant) =='
  & pwsh -NoProfile -File (Join-Path $PSScriptRoot 'setup.ps1') -Php $PHP_BIN
}

Write-Host 'OK: bootstrap Windows completato.'


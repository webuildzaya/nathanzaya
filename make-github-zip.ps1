param(
  [string]$sourceDir = (Get-Location).Path,
  [string]$outDir = (Join-Path (Get-Location).Path "zaya-vercel-upload"),
  [string]$zipPath = (Join-Path (Get-Location).Path "zaya-vercel-upload.zip")
)

# Creates a zip folder that contains only what Vercel needs.
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\make-github-zip.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Source: $sourceDir"
Write-Host "Output folder: $outDir"
Write-Host "Zip: $zipPath"

if (Test-Path $outDir) {
  Write-Host "Cleaning existing output folder..."
  Remove-Item -Recurse -Force $outDir
}

New-Item -ItemType Directory -Path $outDir | Out-Null

function CopyIfExists($relPath) {
  $full = Join-Path $sourceDir $relPath
  if (-not (Test-Path $full)) {
    Write-Host "Skipped (not found): $relPath"
    return
  }

  $target = Join-Path $outDir $relPath
  if (Test-Path $full -PathType Container) {
    Copy-Item -Path $full -Destination $target -Recurse -Force
  } else {
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) {
      New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    Copy-Item -Path $full -Destination $target -Force
  }

  Write-Host "Copied: $relPath"
}

# Root files
CopyIfExists ".gitignore"
CopyIfExists "README.md"
CopyIfExists "package.json"
CopyIfExists "next.config.ts"
CopyIfExists "tsconfig.json"
CopyIfExists "next-env.d.ts"
CopyIfExists "eslint.config.mjs"
CopyIfExists "postcss.config.mjs"
CopyIfExists "vercel.json"

# Optional helper
CopyIfExists "run-zaya-dev.bat"

# Lockfile(s) (optional; include if present)
CopyIfExists "bun.lockb"
CopyIfExists "package-lock.json"

# Folders
CopyIfExists "src"
CopyIfExists "public"
CopyIfExists "prisma"

Write-Host "Creating zip..."
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $outDir "*") -DestinationPath $zipPath -Force

Write-Host "Done."
Write-Host "Zip created at: $zipPath"


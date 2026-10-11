$ErrorActionPreference = 'Stop'
$repoPath = Split-Path $PSScriptRoot -Parent
$runtimePath = Join-Path (Split-Path $repoPath -Parent) 'work/pocketbase'
$migrationPath = Join-Path $runtimePath 'migrations'
New-Item -ItemType Directory -Force $migrationPath | Out-Null
Copy-Item (Join-Path $PSScriptRoot '*.js') $migrationPath -Force
Copy-Item (Join-Path $repoPath 'pb_migrations/*.js') $migrationPath -Force
& (Join-Path $runtimePath 'pocketbase.exe') serve --http=127.0.0.1:8090 --migrationsDir=$migrationPath --hooksDir=(Join-Path $repoPath 'pb_hooks')

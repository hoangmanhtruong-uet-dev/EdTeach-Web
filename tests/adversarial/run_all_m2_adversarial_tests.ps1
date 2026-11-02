# tests/adversarial/run_all_m2_adversarial_tests.ps1
# Master Empirical Test Runner for Milestone 2 Adversarial Hardening
# Starts an isolated PostgreSQL 18 instance on port 54399, runs all SQL, Concurrency, and Unit Suites, then cleanly shuts down.

$ErrorActionPreference = "Stop"
$pgDataDir = "$env:TEMP\pg_m2_54399"
$pgExe = "C:\Program Files\PostgreSQL\18\bin\postgres.exe"
$initDb = "C:\Program Files\PostgreSQL\18\bin\initdb.exe"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "MASTER ADVERSARIAL TEST RUNNER: MILESTONE 2" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. Initialize DB if not present
if (!(Test-Path $pgDataDir)) {
    Write-Host "[1/5] Initializing clean PostgreSQL test cluster..." -ForegroundColor Yellow
    & $initDb -D $pgDataDir -U postgres -A trust | Out-Null
}

# 2. Start PostgreSQL 18 on Port 54399
Write-Host "[2/5] Starting PostgreSQL 18 on port 54399..." -ForegroundColor Yellow
$proc = Start-Process -FilePath $pgExe -ArgumentList "-D `"$pgDataDir`" -p 54399" -PassThru
$isReady = "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe"
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 500
    & $isReady -h 127.0.0.1 -p 54399 2>$null
    if ($LASTEXITCODE -eq 0) { break }
}

try {
    # 3. Run Live SQL Ledger Tests
    Write-Host "`n[3/5] Running Live PostgreSQL SQL Ledger Integrity Test Suite..." -ForegroundColor Yellow
    & $psql -h 127.0.0.1 -p 54399 -U postgres -d postgres -f "tests/adversarial/m2_sql_ledger_live.test.sql"
    if ($LASTEXITCODE -ne 0) { throw "SQL Ledger Test Suite Failed with exit code $LASTEXITCODE" }

    # 4. Run Multi-Threaded Concurrency & FOR UPDATE Row Lock Stress Test
    Write-Host "`n[4/5] Running Multi-Threaded Concurrency & Row Lock Stress Test..." -ForegroundColor Yellow
    python tests/adversarial/m2_concurrency_stress.py
    if ($LASTEXITCODE -ne 0) { throw "Concurrency Stress Test Failed with exit code $LASTEXITCODE" }
} finally {
    Write-Host "`nShutting down isolated PostgreSQL instance..." -ForegroundColor Gray
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

# 5. Run Node.js & Python Adversarial Invariant Test Suites
Write-Host "`n[5/5] Running Adversarial Invariant Test Suites..." -ForegroundColor Yellow
node tests/adversarial/m2_pr1_ledger_and_constants.test.mjs
if ($LASTEXITCODE -ne 0) { throw "PR 1.1 Constants & Payout Test Suite Failed with exit code $LASTEXITCODE" }

node tests/adversarial/m2_subscription_lifecycle.test.mjs
if ($LASTEXITCODE -ne 0) { throw "Subscription Lifecycle Test Suite Failed with exit code $LASTEXITCODE" }

node tests/adversarial/m2_challenger_stress_harness.mjs
if ($LASTEXITCODE -ne 0) { throw "Challenger Stress Harness Failed with exit code $LASTEXITCODE" }

python tests/adversarial/m2_r2_refund_adversarial.py
if ($LASTEXITCODE -ne 0) { throw "M2 R2 Refund Adversarial Test Failed with exit code $LASTEXITCODE" }

Write-Host "`n================================================================================" -ForegroundColor Green
Write-Host "ALL MILESTONE 2 EMPIRICAL ADVERSARIAL TESTS PASSED PERFECTLY WITH ZERO ERRORS!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green

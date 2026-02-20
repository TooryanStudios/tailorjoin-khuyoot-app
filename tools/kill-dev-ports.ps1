param(
  [int[]]$Ports = @(3000, 8788, 8787, 5173)
)

$ErrorActionPreference = 'Continue'

Write-Host "Checking listeners on ports: $($Ports -join ', ')" -ForegroundColor Cyan

$conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $Ports -contains $_.LocalPort }
if (-not $conns) {
  Write-Host "No listeners found." -ForegroundColor Green
  exit 0
}

$targets = $conns | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort
Write-Host "Found:" -ForegroundColor Yellow
$targets | Format-Table -AutoSize | Out-String | Write-Host

$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
  try {
    $proc = Get-Process -Id $procId -ErrorAction Stop
    Write-Host "Stopping PID $procId ($($proc.ProcessName))" -ForegroundColor Yellow
    Stop-Process -Id $procId -Force -ErrorAction Stop
  } catch {
    Write-Host "Failed to stop PID ${procId}: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Start-Sleep -Milliseconds 400

$still = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $Ports -contains $_.LocalPort }
if ($still) {
  Write-Host "Still listening after stop attempt:" -ForegroundColor Red
  $still | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort | Format-Table -AutoSize | Out-String | Write-Host
  exit 1
}

Write-Host "Ports freed." -ForegroundColor Green
exit 0

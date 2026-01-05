# Cleanup old Node processes and free up memory
# Run this when VS Code is slow

Write-Host "🧹 Cleaning up old Node processes..." -ForegroundColor Cyan

# Kill Node processes older than 30 minutes
$cutoffTime = (Get-Date).AddMinutes(-30)
$killedCount = 0

Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -lt $cutoffTime } | ForEach-Object {
    Write-Host "  ❌ Killing Node process: PID $($_.Id) (started at $($_.StartTime))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    $killedCount++
}

if ($killedCount -eq 0) {
    Write-Host "  ✅ No old Node processes found" -ForegroundColor Green
} else {
    Write-Host "  ✅ Killed $killedCount old Node process(es)" -ForegroundColor Green
}

# Optional: Kill all Node processes if requested
if ($args[0] -eq "-all") {
    Write-Host "`n⚠️  Killing ALL Node processes..." -ForegroundColor Red
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ All Node processes killed" -ForegroundColor Green
}

Write-Host "`n💾 Memory usage after cleanup:" -ForegroundColor Cyan
Get-Process | Where-Object { $_.ProcessName -match "Code|node" } | Select-Object ProcessName, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet / 1MB, 2)}} | Sort-Object "Memory(MB)" -Descending | Format-Table -AutoSize

Write-Host "`n✨ Cleanup complete! Reload VS Code window (Ctrl+Shift+P -> Reload Window) for best performance." -ForegroundColor Green

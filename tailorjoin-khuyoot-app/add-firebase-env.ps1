#!/usr/bin/env pwsh
# Script to add Firebase environment variables to Vercel project

$vars = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyBAZnpSeoFEDJ9aHiyCaxN7H7-LBg11lz0"
    "VITE_FIREBASE_APP_ID" = "1:819942872255:web:bfa6ea6e1f8aee949e4a1e"
    "VITE_FIREBASE_AUTH_DOMAIN" = "khuyoot-app01.firebaseapp.com"
    "VITE_FIREBASE_MEASUREMENT_ID" = "G-JY4T6QRPNT"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "819942872255"
    "VITE_FIREBASE_PROJECT_ID" = "khuyoot-app01"
    "VITE_FIREBASE_STORAGE_BUCKET" = "khuyoot-app01.firebasestorage.app"
}

Write-Host "Adding Firebase environment variables to Vercel..." -ForegroundColor Cyan

foreach ($key in $vars.Keys) {
    Write-Host "`nAdding $key..." -ForegroundColor Yellow
    $value = $vars[$key]
    
    # Remove existing variable if it exists
    npx vercel env rm $key production preview development --yes 2>$null
    
    # Add variable to all environments
    Write-Output $value | npx vercel env add $key
}

Write-Host "`n✅ Done! Trigger a new deployment to apply changes." -ForegroundColor Green

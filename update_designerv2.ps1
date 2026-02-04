$file = "src/pages/DesignerV2_1/DesignerV2_1.tsx"
$c = Get-Content $file -Raw

# 1. Replace closing aside with LeftSidebar
$c = $c.Replace('</aside>', '</LeftSidebar>')
Write-Host "1. Fixed closing tag"

# 2. Replace opening aside tag
$old_aside = '<aside className="w-[280px] shrink-0 border-r-2 border-zinc-700 flex flex-col h-screen bg-zinc-900 overflow-hidden">'
$new_aside = '<LeftSidebar'
if ($c.Contains($old_aside)) {
    $c = $c.Replace($old_aside, $new_aside)
    Write-Host "2. Fixed opening aside"
}

Set-Content $file $c
Write-Host "Done - file updated"

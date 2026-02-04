# Disable the extracted section component imports
$file = "src/pages/DesignerV2_1/DesignerV2_1.tsx"
$c = Get-Content $file -Raw

# Comment out the 6 section component imports
$c = $c -replace "import \{ ComparisonPanel \} from './sections/ComparisonPanel';", "// import { ComparisonPanel } from './sections/ComparisonPanel';"
$c = $c -replace "import \{ FullComparisonPanel \} from './sections/FullComparisonPanel';", "// import { FullComparisonPanel } from './sections/FullComparisonPanel';"
$c = $c -replace "import \{ HistoryPanel \} from './sections/HistoryPanel';", "// import { HistoryPanel } from './sections/HistoryPanel';"
$c = $c -replace "import \{ LeftSidebar \} from './sections/LeftSidebar';", "// import { LeftSidebar } from './sections/LeftSidebar';"
$c = $c -replace "import \{ ToolsAndLightingPanel \} from './sections/ToolsAndLighting';", "// import { ToolsAndLightingPanel } from './sections/ToolsAndLighting';"
$c = $c -replace "import \{ TopBar \} from './sections/TopBar';", "// import { TopBar } from './sections/TopBar';"

Set-Content $file $c
Write-Host "✓ Disabled all 6 section component imports"

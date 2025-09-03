# Save-Scene-5.ps1
# Overwrites the "Recall-Scene-5.bat" file with current servo positions.

# --- CONFIGURATION ---
$UscCmdPath = "C:\Program Files (x86)\Pololu\Maestro\bin\UscCmd.exe"
$OutputFile = "C:\HVAC_House\Recall-Scene-5.bat"
$NumberOfServos = 8 # We only care about the first 8

# --- SCRIPT LOGIC ---
$statusOutput = & $UscCmdPath --status

# Start building the content for the new batch file
$fileContent = ":: Scene 1: Custom saved positions`r`n@echo off`r`n"

# Loop from servo 0 to 7
for ($i = 0; $i -lt $NumberOfServos; $i++) {
    $currentPositionLine = $statusOutput | Select-String -Pattern "^\s*$($i)\s+"
    $position = ($currentPositionLine -split '\s+')[5]
    $fileContent += """$UscCmdPath"" --servo $($i),$($position)`r`n"
}

# Write the new content, overwriting the old file
Set-Content -Path $OutputFile -Value $fileContent
# Nudge-Servo.ps1 -- Accepts Servo Number as a Parameter
param (
    [string]$servoChannel,
    [string]$direction
)

# --- CONFIGURATION ---
$UscCmdPath = "C:\Program Files (x86)\Pololu\Maestro\bin\UscCmd.exe"
# $StateFile variable is no longer needed.
$NudgeAmount = 128  # 32 µs. Adjust for finer or coarser control.
$MinLimit = 1984    # Your 496 µs limit
$MaxLimit = 7232    # Your 1808 µs limit

# --- SCRIPT LOGIC ---
try {
    # The $servoChannel is now passed in directly as a parameter.

    # 1. Get the current status from the Maestro.
    $statusOutput = & $UscCmdPath --status

    # 2. Find the line that STARTS with our channel number.
    $currentPositionLine = $statusOutput | Select-String -Pattern "^\s*$($servoChannel)\s+"
    
    # 3. Split the line and grab the 6th item (index 5), which is the 'pos' column.
    $currentPosition = ($currentPositionLine -split '\s+')[5]

    # 4. Calculate the new position.
    $newPosition = 0
    if ($direction -eq "plus") {
        $newPosition = [int]$currentPosition + $NudgeAmount
    }
    elseif ($direction -eq "minus") {
        $newPosition = [int]$currentPosition - $NudgeAmount
    }

    # 5. Enforce the min/max limits.
    if ($newPosition -gt $MaxLimit) { $newPosition = $MaxLimit }
    if ($newPosition -lt $MinLimit) { $newPosition = $MinLimit }

    # 6. Send the command to the Maestro to move the servo.
    & $UscCmdPath --servo "$($servoChannel),$($newPosition)"
}
catch {
    # Fail silently if something goes wrong.
}
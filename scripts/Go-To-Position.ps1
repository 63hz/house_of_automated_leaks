param ([string]$positionName)

$UscCmdPath = "C:\Program Files (x86)\Pololu\Maestro\bin\UscCmd.exe"
$StateFile = "C:\HVAC_House\current_servo.txt"
$MinLimit = 1984
$MaxLimit = 7232
$NeutralPos = 4000 # Example neutral, adjust as needed

$servoChannel = (Get-Content $StateFile).Trim()
$targetPosition = 0

if ($positionName -eq "min") { $targetPosition = $MinLimit }
elseif ($positionName -eq "max") { $targetPosition = $MaxLimit }
elseif ($positionName -eq "neutral") { $targetPosition = $NeutralPos }

& $UscCmdPath --servo "$($servoChannel),$($targetPosition)"
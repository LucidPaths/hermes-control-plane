# Hermes Control Plane — Windows Auto-Start
# Add to Task Scheduler for "run at logon"
#
# Setup (one-time, from PowerShell as Admin):
#   $action = New-ScheduledTaskAction -Execute "wsl" -Argument "-d Ubuntu -- bash -l -c `$HOME/hermes-control-plane/scripts/start.sh"
#   $trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERNAME"
#   Register-ScheduledTask -TaskName "HermesControlPlane" -Action $action -Trigger $trigger -Description "Start Hermes Agent + WebUI at login"
#
# Or just run this script from a Startup shortcut:
#   Place a .vbs wrapper in shell:startup that runs this invisibly

# WSL command to start everything
# This runs inside WSL, not PowerShell

$wslDistro = "Ubuntu"
$scriptPath = "/home/$env:USERNAME/hermes-control-plane/scripts/start.sh"

# Start WSL with the start script
Start-Process wsl -ArgumentList "-d", $wslDistro, "--", "bash", "-l", "-c", $scriptPath -WindowStyle Hidden

# Wait a moment then open browser
Start-Sleep -Seconds 5
Start-Process "http://localhost:8787"
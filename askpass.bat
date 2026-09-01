@echo off
if not "%VPS_SSH_PASSWORD%"=="" (
    echo %VPS_SSH_PASSWORD%
) else (
    set /p pwd=<"%~dp0.ssh_pass"
    echo %pwd%
)

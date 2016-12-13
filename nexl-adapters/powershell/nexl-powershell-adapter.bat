@echo off

rem is powershell.exe installed on this computer ?
for %%X in (powershell.exe) do (set FOUND=%%~$PATH:X)
if not defined FOUND (
	echo powershell.exe is not installed on this computer
	exit 1
)

rem executing powershell script
rem                                                       | nexl server     | nexl source | nexl expression       | arguments
powershell.exe -ExecutionPolicy ByPass -File "%~dpn0.ps1" "nexlserver:9191" "/common/facts.js"   "${DISTANCE_TO_MOON}"   "YEAR=1979"

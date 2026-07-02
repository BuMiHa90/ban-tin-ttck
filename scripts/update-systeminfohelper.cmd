@echo off
setlocal EnableExtensions

set "OUT=F:\systeminfohelper.json"
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%PS%" (
  echo Windows PowerShell not found: %PS% 1>&2
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'SilentlyContinue';" ^
  "function FirstPath($name) { $cmd = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($cmd) { $cmd.Source } else { $null } }" ^
  "function VersionText($path, $arg) { if (-not $path) { return $null }; try { (& $path $arg 2>$null | Select-Object -First 1).ToString().Trim() } catch { $null } }" ^
  "$os = Get-CimInstance Win32_OperatingSystem;" ^
  "$pythonPath = FirstPath 'python.exe';" ^
  "$pwshPath = FirstPath 'pwsh.exe';" ^
  "$nodePath = FirstPath 'node.exe';" ^
  "$pwshVersion = if ($pwshPath) { try { (& $pwshPath -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>$null | Select-Object -First 1).ToString().Trim() } catch { $null } } else { $null };" ^
  "$pwshMajor = if ($pwshVersion -match '^\d+') { [int]$Matches[0] } else { $null };" ^
  "$data = [ordered]@{" ^
  "  generated_at = (Get-Date).ToString('o');" ^
  "  source_script = '%~f0';" ^
  "  output_path = '%OUT%';" ^
  "  os = [ordered]@{ caption = $os.Caption; version = $os.Version; build_number = $os.BuildNumber; architecture = $os.OSArchitecture };" ^
  "  python = [ordered]@{ path = $pythonPath; version = (VersionText $pythonPath '--version'); ok = [bool]($pythonPath -and ($pythonPath -like '*.exe')) };" ^
  "  pwsh = [ordered]@{ path = $pwshPath; version = $pwshVersion; major = $pwshMajor; ok = [bool]($pwshPath -and $pwshMajor -ge 7) };" ^
  "  node = [ordered]@{ path = $nodePath; version = (VersionText $nodePath '--version'); ok = [bool]($nodePath -and ($nodePath -like '*.exe')) };" ^
  "};" ^
  "$json = $data | ConvertTo-Json -Depth 5;" ^
  "Set-Content -LiteralPath '%OUT%' -Value $json -Encoding UTF8;" ^
  "Write-Output ('updated ' + '%OUT%')"

exit /b %ERRORLEVEL%

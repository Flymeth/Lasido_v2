@echo off
set /p use_shards="Use shards ? [Y/N]> "
if %use_shards%==Y (
    node .launch.js
) else (
    npm start
)

rem This is achieve only if the bot turns off
echo Bot turned off!
pause
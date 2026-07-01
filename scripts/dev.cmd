@echo off
set PATH=C:\Program Files\nodejs;%PATH%
rem Esta PC tiene algo (antivirus/proxy) que inspecciona HTTPS con un
rem certificado propio. Node no confia en el por defecto, lo que rompe
rem las llamadas a Supabase hechas del lado del servidor (Server
rem Components, middleware). --use-system-ca hace que Node confie en el
rem almacen de certificados de Windows, igual que el navegador.
set NODE_OPTIONS=--use-system-ca
cd /d "%~dp0.."
call npm run dev

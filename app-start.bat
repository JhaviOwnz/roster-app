@echo off
title Kamana Roster App

REM Inicia backend
start "Backend Server" cmd /k "cd server && npm start"

REM Inicia frontend
start "Frontend React" cmd /k "cd client && npm start"

REM Espera unos segundos y abre el navegador
timeout /t 5 >nul
start http://localhost:3000

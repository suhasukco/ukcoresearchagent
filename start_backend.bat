@echo off
cd /d %~dp0
set PYTHONPATH=%~dp0
cd backend
echo Starting UKCOResearcher backend on http://localhost:8000 ...
..\venv\Scripts\python.exe -m uvicorn server.app:app --reload --host 0.0.0.0 --port 8000

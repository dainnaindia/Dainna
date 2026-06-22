: << 'BATCH'
@echo off
title Dainna 2.1 Dev Servers
echo ==================================================
echo  Starting Dainna 2.1 Development Servers (Windows CMD)
echo ==================================================

echo Starting backend api server...
start "Dainna Backend" cmd /c "cd backend && npm run dev"

echo Starting frontend dev server...
start "Dainna Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Application launched!
echo Backend is running on port 5000 (starts in a separate window)
echo Frontend is running on port 3000 (starts in a separate window)
echo.
echo Open http://localhost:3000 in your browser to access Dainna 2.1.
echo ==================================================
pause
exit /b
BATCH

# This is the Bash script section.
cleanup() {
    echo ""
    echo "Stopping development servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null
    fi
    exit 0
}

trap cleanup INT TERM

echo "=================================================="
echo " Starting Dainna 2.1 Development Servers (Bash)"
echo "=================================================="

# Start backend
echo "Starting backend api server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend dev server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend started (PID: $BACKEND_PID)"
echo "Frontend started (PID: $FRONTEND_PID)"
echo "Application running at http://localhost:3000"
echo "Press Ctrl+C to stop both servers."
echo "=================================================="

wait

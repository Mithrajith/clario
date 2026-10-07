#!/usr/bin/env bash
# ==============================================================================
# Clario Enterprise Knowledge Intelligence — Lifecycle Management Script
# Usage:
#   ./clario.sh setup   - Install backend (uv) & frontend (npm) dependencies
#   ./clario.sh start   - Start backend (uvicorn) and frontend (vite) in background
#   ./clario.sh stop    - Stop all running Clario backend and frontend processes
#   ./clario.sh restart - Restart both backend and frontend services
#   ./clario.sh status  - Check running service status and health
# ==============================================================================

set -e

export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"
PID_DIR="${PROJECT_ROOT}/.run"
BACKEND_PID_FILE="${PID_DIR}/backend.pid"
FRONTEND_PID_FILE="${PID_DIR}/frontend.pid"
BACKEND_LOG="${PID_DIR}/backend.log"
FRONTEND_LOG="${PID_DIR}/frontend.log"


# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

mkdir -p "${PID_DIR}"

print_banner() {
    echo -e "${BLUE}======================================================${NC}"
    echo -e "${BLUE}  Clario Enterprise Knowledge Intelligence Platform   ${NC}"
    echo -e "${BLUE}======================================================${NC}"
}

check_dependencies() {
    echo -e "${BLUE}[*] Checking system prerequisites...${NC}"
    
    if ! command -v uv &> /dev/null; then
        echo -e "${RED}[!] 'uv' package manager is not installed.${NC}"
        echo -e "    Install uv via: curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}[!] 'npm' (Node.js) is not installed.${NC}"
        echo -e "    Please install Node.js v18+ and npm."
        exit 1
    fi

    echo -e "${GREEN}[+] Prerequisites verified: uv and npm are available.${NC}"
}

setup() {
    print_banner
    check_dependencies

    # 1. Environment Config
    echo -e "\n${BLUE}[1/3] Checking environment file...${NC}"
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        if [ -f "${PROJECT_ROOT}/.env.example" ]; then
            cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
            echo -e "${GREEN}[+] Created .env from .env.example template.${NC}"
        else
            echo -e "${YELLOW}[!] Warning: .env not found and .env.example missing.${NC}"
        fi
    else
        echo -e "${GREEN}[+] .env configuration file found.${NC}"
    fi

    # 2. Backend Dependencies with uv
    echo -e "\n${BLUE}[2/3] Installing backend dependencies with uv...${NC}"
    cd "${BACKEND_DIR}"
    uv sync
    echo -e "${GREEN}[+] Backend environment configured successfully.${NC}"

    # 3. Frontend Dependencies with npm
    echo -e "\n${BLUE}[3/3] Installing frontend dependencies with npm...${NC}"
    cd "${FRONTEND_DIR}"
    npm install
    echo -e "${GREEN}[+] Frontend dependencies installed successfully.${NC}"

    echo -e "\n${GREEN}======================================================${NC}"
    echo -e "${GREEN}  Setup Complete! Start services with: ./clario.sh start${NC}"
    echo -e "${GREEN}======================================================${NC}"
}

start() {
    print_banner
    check_dependencies

    # Check if backend is already running
    if [ -f "${BACKEND_PID_FILE}" ] && kill -0 "$(cat "${BACKEND_PID_FILE}")" 2>/dev/null; then
        echo -e "${YELLOW}[!] Backend is already running (PID: $(cat "${BACKEND_PID_FILE}")).${NC}"
    else
        echo -e "${BLUE}[*] Starting FastAPI Backend on port 8000 with uv uvicorn...${NC}"
        cd "${BACKEND_DIR}"
        nohup uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 > "${BACKEND_LOG}" 2>&1 &
        BACKEND_PID=$!
        echo "${BACKEND_PID}" > "${BACKEND_PID_FILE}"
        echo -e "${GREEN}[+] Backend started (PID: ${BACKEND_PID}). Log: ${BACKEND_LOG}${NC}"
    fi

    # Check if frontend is already running
    if [ -f "${FRONTEND_PID_FILE}" ] && kill -0 "$(cat "${FRONTEND_PID_FILE}")" 2>/dev/null; then
        echo -e "${YELLOW}[!] Frontend is already running (PID: $(cat "${FRONTEND_PID_FILE}")).${NC}"
    else
        echo -e "${BLUE}[*] Starting Vite Frontend on port 5173...${NC}"
        cd "${FRONTEND_DIR}"
        nohup npm run dev -- --host 0.0.0.0 --port 5173 > "${FRONTEND_LOG}" 2>&1 &
        FRONTEND_PID=$!
        echo "${FRONTEND_PID}" > "${FRONTEND_PID_FILE}"
        echo -e "${GREEN}[+] Frontend started (PID: ${FRONTEND_PID}). Log: ${FRONTEND_LOG}${NC}"
    fi

    echo -e "\n${GREEN}======================================================${NC}"
    echo -e "  Clario is running!"
    echo -e "  - Frontend UI:  ${GREEN}http://localhost:5173${NC}"
    echo -e "  - Backend API:  ${GREEN}http://localhost:8000${NC}"
    echo -e "  - API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  - Stop Command: ${YELLOW}./clario.sh stop${NC}"
    echo -e "${GREEN}======================================================${NC}"
}

stop() {
    print_banner
    echo -e "${BLUE}[*] Stopping Clario services...${NC}"

    # Stop Frontend
    if [ -f "${FRONTEND_PID_FILE}" ]; then
        PID=$(cat "${FRONTEND_PID_FILE}")
        if kill -0 "${PID}" 2>/dev/null; then
            echo -e "${YELLOW}[*] Stopping Frontend (PID: ${PID})...${NC}"
            kill "${PID}" 2>/dev/null || true
            sleep 1
            if kill -0 "${PID}" 2>/dev/null; then
                kill -9 "${PID}" 2>/dev/null || true
            fi
            echo -e "${GREEN}[+] Frontend stopped.${NC}"
        fi
        rm -f "${FRONTEND_PID_FILE}"
    fi

    # Clean up any lingering Vite processes on port 5173
    fuser -k 5173/tcp 2>/dev/null || true

    # Stop Backend
    if [ -f "${BACKEND_PID_FILE}" ]; then
        PID=$(cat "${BACKEND_PID_FILE}")
        if kill -0 "${PID}" 2>/dev/null; then
            echo -e "${YELLOW}[*] Stopping Backend (PID: ${PID})...${NC}"
            kill "${PID}" 2>/dev/null || true
            sleep 1
            if kill -0 "${PID}" 2>/dev/null; then
                kill -9 "${PID}" 2>/dev/null || true
            fi
            echo -e "${GREEN}[+] Backend stopped.${NC}"
        fi
        rm -f "${BACKEND_PID_FILE}"
    fi

    # Clean up any lingering Uvicorn processes on port 8000
    fuser -k 8000/tcp 2>/dev/null || true

    echo -e "${GREEN}[+] All Clario services have been stopped successfully.${NC}"
}

status() {
    print_banner
    echo -e "${BLUE}[*] Checking Clario services status...${NC}\n"

    # Backend check
    BACKEND_RUNNING=false
    if [ -f "${BACKEND_PID_FILE}" ] && kill -0 "$(cat "${BACKEND_PID_FILE}")" 2>/dev/null; then
        BACKEND_RUNNING=true
        PID=$(cat "${BACKEND_PID_FILE}")
        echo -e "  Backend (FastAPI):  ${GREEN}RUNNING${NC} (PID: ${PID}, Port: 8000)"
    else
        echo -e "  Backend (FastAPI):  ${RED}STOPPED${NC}"
    fi

    # Frontend check
    FRONTEND_RUNNING=false
    if [ -f "${FRONTEND_PID_FILE}" ] && kill -0 "$(cat "${FRONTEND_PID_FILE}")" 2>/dev/null; then
        FRONTEND_RUNNING=true
        PID=$(cat "${FRONTEND_PID_FILE}")
        echo -e "  Frontend (Vite):    ${GREEN}RUNNING${NC} (PID: ${PID}, Port: 5173)"
    else
        echo -e "  Frontend (Vite):    ${RED}STOPPED${NC}"
    fi

    # Healthcheck if backend running
    if [ "${BACKEND_RUNNING}" = true ]; then
        echo -e "\n${BLUE}[*] Probing Backend Health (http://localhost:8000/health)...${NC}"
        HEALTH=$(curl -s http://localhost:8000/health || echo "UNREACHABLE")
        echo -e "  Health Response: ${GREEN}${HEALTH}${NC}"
    fi
}

case "$1" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 1
        start
        ;;
    status)
        status
        ;;
    *)
        print_banner
        echo "Usage: $0 {setup|start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  setup    - Install all dependencies (uv sync & npm install)"
        echo "  start    - Start backend (uv uvicorn) and frontend (vite)"
        echo "  stop     - Stop all running Clario processes"
        echo "  restart  - Restart backend and frontend"
        echo "  status   - Show status and health of services"
        echo ""
        exit 1
        ;;
esac

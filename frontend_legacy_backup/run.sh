#!/usr/bin/env bash
# NASA AERO-FIRE 3D Local Server Launcher
PORT=${1:-8080}
echo "================================================================="
echo "   NASA AERO-FIRE // 3D Navier-Stokes Combustion Simulator"
echo "================================================================="
echo "Starting local HTTP server on http://localhost:${PORT}"
echo "Open your browser to: http://localhost:${PORT}"
echo "Press Ctrl+C to stop the server."
echo "================================================================="
/usr/bin/python3 -m http.server "${PORT}"


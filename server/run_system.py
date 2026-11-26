#!/usr/bin/env python3
"""
Script to run both the server and Huey consumer processes together
"""

import subprocess
import sys
import signal
import time
import os

def signal_handler(signum, frame):
    print("\nShutting down server and Huey consumer...")
    sys.exit(0)

def main():
    # Set up signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("Starting DaVinci Research System with Huey...")
    print("=" * 50)
    
    # Start Huey consumer process
    print("Starting Huey consumer...")
    # Get the directory where this script is located (server directory)
    server_dir = os.path.dirname(os.path.abspath(__file__))
    consumer_process = subprocess.Popen([
        sys.executable, "-m", "huey.bin.huey_consumer", "tasks.huey", "-v"
    ], cwd=server_dir)
    
    # Give consumer a moment to start
    time.sleep(2)
    
    # Start server process
    print("Starting Flask server...")
    server_process = subprocess.Popen([
        sys.executable, os.path.join(os.path.dirname(__file__), "server.py")
    ])
    
    print("\n" + "=" * 50)
    print("🚀 DaVinci Research System is running!")
    print("📊 Server: http://localhost:5000")
    print("🔌 WebSocket: ws://localhost:5000")
    print("⚡ Huey Consumer: Processing background tasks")
    print("💾 Queue: SQLite-based persistent storage")
    print("\nPress Ctrl+C to stop all processes")
    print("=" * 50)
    
    try:
        # Wait for processes
        while True:
            # Check if processes are still running
            if consumer_process.poll() is not None:
                print("❌ Huey consumer died! Restarting...")
                consumer_process = subprocess.Popen([
                    sys.executable, "-m", "huey.bin.huey_consumer", "tasks.huey", "-v"
                ], cwd=server_dir)
            
            if server_process.poll() is not None:
                print("❌ Server process died! Restarting...")
                server_process = subprocess.Popen([
                    sys.executable, os.path.join(os.path.dirname(__file__), "server.py")
                ])
            
            time.sleep(5)  # Check every 5 seconds
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping all processes...")
        
        # Terminate processes
        try:
            consumer_process.terminate()
            server_process.terminate()
            
            # Wait for graceful shutdown
            consumer_process.wait(timeout=10)
            server_process.wait(timeout=10)
            
        except subprocess.TimeoutExpired:
            print("⚠️  Force killing processes...")
            consumer_process.kill()
            server_process.kill()
        
        print("✅ All processes stopped.")

if __name__ == "__main__":
    main() 
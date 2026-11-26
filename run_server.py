import os
import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# This script watches the 'server' folder and restarts 'server.py' automatically
# whenever code changes. This is a workaround for Windows + Flask-SocketIO
# crashing when using the built-in 'debug=True' reloader.

class RestartHandler(FileSystemEventHandler):
    def __init__(self, script_to_run):
        self.script_to_run = script_to_run
        self.process = None
        self.start_process()

    def start_process(self):
        if self.process:
            print("🛑 Stopping server...")
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        
        print("🚀 Starting server...")
        self.process = subprocess.Popen([sys.executable, self.script_to_run])

    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            print(f"🔄 Change detected in {event.src_path}. Restarting...")
            self.start_process()

if __name__ == "__main__":
    server_script = os.path.join("server", "server.py")
    
    if not os.path.exists(server_script):
        print(f"❌ Could not find {server_script}")
        sys.exit(1)

    print(f"👀 Watching 'server/' for changes to restart {server_script}...")
    
    handler = RestartHandler(server_script)
    
    observer = Observer()
    observer.schedule(handler, path="server", recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Exiting watcher...")
        observer.stop()
        if handler.process:
            handler.process.terminate()
    observer.join()

from __future__ import annotations

import importlib
import importlib.util
import os
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
REQUIREMENTS_FILE = BACKEND_ROOT / "requirements.txt"
REQUIRED_MODULES = ("fastapi", "httpx", "uvicorn", "docx", "matplotlib", "dotenv")


def is_verbose() -> bool:
    return os.environ.get("AQI_TRACKER_VERBOSE") == "1"


def ensure_backend_dependencies() -> None:
    missing = [name for name in REQUIRED_MODULES if importlib.util.find_spec(name) is None]
    if missing:
        print("Installing required packages. This may take a moment...")
        command = [sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)]
        if not is_verbose():
            command.insert(4, "-q")
        subprocess.check_call(command)


def main() -> None:
    if not REQUIREMENTS_FILE.exists():
        raise FileNotFoundError(f"Could not find {REQUIREMENTS_FILE}")

    ensure_backend_dependencies()

    if str(BACKEND_ROOT) not in sys.path:
        sys.path.insert(0, str(BACKEND_ROOT))

    app_module = importlib.import_module("app.main")
    app_module.run_dev_server()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAQI Tracker stopped.")

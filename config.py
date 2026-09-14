import os

class Config:
    # Absolute paths for deployment environments such as PythonAnywhere.
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')
    RIDERS_FILE = os.path.join(DATA_DIR, 'riders.json')

    # Server configuration.
    DEBUG = False  # Keep disabled in production.
    HOST = '0.0.0.0'
    PORT = 5000

    @staticmethod
    def init_directories():
        """Create required directories when they do not exist."""
        os.makedirs(Config.DATA_DIR, exist_ok=True)
        print(f"✅ Data directory ready: {Config.DATA_DIR}")

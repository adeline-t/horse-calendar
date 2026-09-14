import json
import os
from config import Config

class DataService:
    """Read and write the application's JSON data files."""

    @staticmethod
    def init_files():
        """Create missing data files with default content."""

        # Create riders.json with default data when necessary.
        if not os.path.exists(Config.RIDERS_FILE):
            default_riders = [
                {"name": "Alice", "color": "#FF6B6B", "active_from": "2020-01-01"},
                {"name": "Bob", "color": "#4ECDC4", "active_from": "2021-06-15"},
                {"name": "Charlie", "color": "#45B7D1", "active_from": "2022-03-10"}
            ]
            with open(Config.RIDERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_riders, f, ensure_ascii=False, indent=2)
            print(f"✅ Created file: {Config.RIDERS_FILE}")

        # Create an empty assignments.json file.
        if not os.path.exists(Config.ASSIGNMENTS_FILE):
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
            print(f"✅ Created file: {Config.ASSIGNMENTS_FILE}")

        # Verify file access, especially in hosted environments.
        try:
            # Test access through the normal read methods.
            DataService.read_riders()
            DataService.read_assignments()
            print("✅ Data file permissions verified")
        except Exception as e:
            print(f"⚠️ Data file permission issue: {e}")

    @staticmethod
    def read_riders():
        """Read riders.json."""
        try:
            if not os.path.exists(Config.RIDERS_FILE):
                print(f"⚠️ File not found: {Config.RIDERS_FILE}")
                return []

            with open(Config.RIDERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except json.JSONDecodeError as e:
            print(f"❌ Invalid rider JSON: {e}")
            return []
        except Exception as e:
            print(f"❌ Error reading riders: {e}")
            return []

    @staticmethod
    def write_riders(riders):
        """Write riders.json."""
        try:
            # Create the parent directory when necessary.
            os.makedirs(os.path.dirname(Config.RIDERS_FILE), exist_ok=True)

            # Write UTF-8 JSON.
            with open(Config.RIDERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(riders, f, ensure_ascii=False, indent=2)

            # Verify that the target exists after writing.
            if os.path.exists(Config.RIDERS_FILE):
                print(f"✅ Saved {len(riders)} riders")
                return True
            else:
                print("❌ Failed to save riders")
                return False

        except Exception as e:
            print(f"❌ Error writing riders: {e}")
            return False

    @staticmethod
    def read_assignments():
        """Read assignments.json."""
        try:
            if not os.path.exists(Config.ASSIGNMENTS_FILE):
                print(f"⚠️ File not found: {Config.ASSIGNMENTS_FILE}")
                return {}

            with open(Config.ASSIGNMENTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except json.JSONDecodeError as e:
            print(f"❌ Invalid assignment JSON: {e}")
            return {}
        except Exception as e:
            print(f"❌ Error reading assignments: {e}")
            return {}

    @staticmethod
    def write_assignments(assignments):
        """Write assignments.json."""
        try:
            # Create the parent directory when necessary.
            os.makedirs(os.path.dirname(Config.ASSIGNMENTS_FILE), exist_ok=True)

            # Write UTF-8 JSON.
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(assignments, f, ensure_ascii=False, indent=2)

            # Verify that the target exists after writing.
            if os.path.exists(Config.ASSIGNMENTS_FILE):
                print(f"✅ Saved assignments for {len(assignments)} dates")
                return True
            else:
                print("❌ Failed to save assignments")
                return False

        except Exception as e:
            print(f"❌ Error writing assignments: {e}")
            return False

    @staticmethod
    def get_file_info():
        """Return diagnostic information about data files."""
        info = {
            'riders': {
                'exists': os.path.exists(Config.RIDERS_FILE),
                'path': Config.RIDERS_FILE,
                'readable': os.access(Config.RIDERS_FILE, os.R_OK) if os.path.exists(Config.RIDERS_FILE) else False,
                'writable': os.access(Config.RIDERS_FILE, os.W_OK) if os.path.exists(Config.RIDERS_FILE) else False,
            },
            'assignments': {
                'exists': os.path.exists(Config.ASSIGNMENTS_FILE),
                'path': Config.ASSIGNMENTS_FILE,
                'readable': os.access(Config.ASSIGNMENTS_FILE, os.R_OK) if os.path.exists(Config.ASSIGNMENTS_FILE) else False,
                'writable': os.access(Config.ASSIGNMENTS_FILE, os.W_OK) if os.path.exists(Config.ASSIGNMENTS_FILE) else False,
            },
            'data_dir': {
                'exists': os.path.exists(Config.DATA_DIR),
                'path': Config.DATA_DIR,
                'writable': os.access(Config.DATA_DIR, os.W_OK) if os.path.exists(Config.DATA_DIR) else False,
            }
        }
        return info

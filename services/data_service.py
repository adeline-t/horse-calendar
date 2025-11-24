import json
import os
from config import Config

class DataService:
    """Service pour gérer la lecture/écriture des fichiers JSON"""

    @staticmethod
    def init_files():
        """Initialiser les fichiers de données s'ils n'existent pas"""
        if not os.path.exists(Config.CAVALIERS_FILE):
            with open(Config.CAVALIERS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f)

        if not os.path.exists(Config.ASSIGNMENTS_FILE):
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f)

    @staticmethod
    def read_cavaliers():
        """Lire le fichier cavaliers.json"""
        try:
            with open(Config.CAVALIERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur lecture cavaliers: {e}")
            return []

    @staticmethod
    def write_cavaliers(cavaliers):
        """Écrire dans le fichier cavaliers.json"""
        try:
            with open(Config.CAVALIERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(cavaliers, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Erreur écriture cavaliers: {e}")
            return False

    @staticmethod
    def read_assignments():
        """Lire le fichier assignments.json"""
        try:
            with open(Config.ASSIGNMENTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur lecture assignments: {e}")
            return {}

    @staticmethod
    def write_assignments(assignments):
        """Écrire dans le fichier assignments.json"""
        try:
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(assignments, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Erreur écriture assignments: {e}")
            return False

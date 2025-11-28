import json
import os
from config import Config

class DataService:
    """Service pour gérer la lecture/écriture des fichiers JSON"""

    @staticmethod
    def init_files():
        """Initialiser les fichiers de données s'ils n'existent pas"""

        # Créer cavaliers.json avec des données par défaut si nécessaire
        if not os.path.exists(Config.CAVALIERS_FILE):
            default_cavaliers = [
                {"name": "Alice", "color": "#FF6B6B", "active_from": "2020-01-01"},
                {"name": "Bob", "color": "#4ECDC4", "active_from": "2021-06-15"},
                {"name": "Charlie", "color": "#45B7D1", "active_from": "2022-03-10"}
            ]
            with open(Config.CAVALIERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_cavaliers, f, ensure_ascii=False, indent=2)
            print(f"✅ Fichier créé : {Config.CAVALIERS_FILE}")

        # Créer assignments.json vide
        if not os.path.exists(Config.ASSIGNMENTS_FILE):
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
            print(f"✅ Fichier créé : {Config.ASSIGNMENTS_FILE}")

        # Vérifier les permissions (important pour PythonAnywhere)
        try:
            # Tester l'écriture
            DataService.read_cavaliers()
            DataService.read_assignments()
            print(f"✅ Permissions fichiers OK")
        except Exception as e:
            print(f"⚠️ Problème de permissions : {e}")

    @staticmethod
    def read_cavaliers():
        """Lire le fichier cavaliers.json"""
        try:
            if not os.path.exists(Config.CAVALIERS_FILE):
                print(f"⚠️ Fichier non trouvé : {Config.CAVALIERS_FILE}")
                return []

            with open(Config.CAVALIERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except json.JSONDecodeError as e:
            print(f"❌ Erreur JSON cavaliers: {e}")
            return []
        except Exception as e:
            print(f"❌ Erreur lecture cavaliers: {e}")
            return []

    @staticmethod
    def write_cavaliers(cavaliers):
        """Écrire dans le fichier cavaliers.json"""
        try:
            # Créer le dossier parent si nécessaire
            os.makedirs(os.path.dirname(Config.CAVALIERS_FILE), exist_ok=True)

            # Écrire avec permissions explicites
            with open(Config.CAVALIERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(cavaliers, f, ensure_ascii=False, indent=2)

            # Vérifier que l'écriture a réussi
            if os.path.exists(Config.CAVALIERS_FILE):
                print(f"✅ Cavaliers sauvegardés : {len(cavaliers)} entrées")
                return True
            else:
                print(f"❌ Échec sauvegarde cavaliers")
                return False

        except Exception as e:
            print(f"❌ Erreur écriture cavaliers: {e}")
            return False

    @staticmethod
    def read_assignments():
        """Lire le fichier assignments.json"""
        try:
            if not os.path.exists(Config.ASSIGNMENTS_FILE):
                print(f"⚠️ Fichier non trouvé : {Config.ASSIGNMENTS_FILE}")
                return {}

            with open(Config.ASSIGNMENTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except json.JSONDecodeError as e:
            print(f"❌ Erreur JSON assignments: {e}")
            return {}
        except Exception as e:
            print(f"❌ Erreur lecture assignments: {e}")
            return {}

    @staticmethod
    def write_assignments(assignments):
        """Écrire dans le fichier assignments.json"""
        try:
            # Créer le dossier parent si nécessaire
            os.makedirs(os.path.dirname(Config.ASSIGNMENTS_FILE), exist_ok=True)

            # Écrire avec permissions explicites
            with open(Config.ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(assignments, f, ensure_ascii=False, indent=2)

            # Vérifier que l'écriture a réussi
            if os.path.exists(Config.ASSIGNMENTS_FILE):
                print(f"✅ Assignments sauvegardés : {len(assignments)} dates")
                return True
            else:
                print(f"❌ Échec sauvegarde assignments")
                return False

        except Exception as e:
            print(f"❌ Erreur écriture assignments: {e}")
            return False

    @staticmethod
    def get_file_info():
        """Obtenir des informations sur les fichiers (debug)"""
        info = {
            'cavaliers': {
                'exists': os.path.exists(Config.CAVALIERS_FILE),
                'path': Config.CAVALIERS_FILE,
                'readable': os.access(Config.CAVALIERS_FILE, os.R_OK) if os.path.exists(Config.CAVALIERS_FILE) else False,
                'writable': os.access(Config.CAVALIERS_FILE, os.W_OK) if os.path.exists(Config.CAVALIERS_FILE) else False,
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

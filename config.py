import os

class Config:
    # Chemins absolus pour PythonAnywhere
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')
    CAVALIERS_FILE = os.path.join(DATA_DIR, 'cavaliers.json')

    # Configuration serveur
    DEBUG = False  # ⚠️ Mettre False en production sur PythonAnywhere
    HOST = '0.0.0.0'
    PORT = 5000

    @staticmethod
    def init_directories():
        """Créer les dossiers nécessaires s'ils n'existent pas"""
        os.makedirs(Config.DATA_DIR, exist_ok=True)
        print(f"✅ Dossier data créé/vérifié : {Config.DATA_DIR}")

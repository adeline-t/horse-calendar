import os

class Config:
    # Dossiers
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    # Fichiers de données
    CAVALIERS_FILE = os.path.join(DATA_DIR, 'cavaliers.json')
    ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')

    # Configuration Flask
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 4000

    @staticmethod
    def init_directories():
        """Créer les dossiers nécessaires"""
        if not os.path.exists(Config.DATA_DIR):
            os.makedirs(Config.DATA_DIR)

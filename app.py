import gunicorn
from flask import Flask
from config import Config
from services.data_service import DataService

# Importer les blueprints
from routes.pages import pages_bp
from routes.cavaliers import cavaliers_bp
from routes.assignments import assignments_bp
from routes.stats import stats_bp

def create_app():
    """Créer et configurer l'application Flask"""
    app = Flask(__name__)

    # Initialiser les dossiers et fichiers
    Config.init_directories()
    DataService.init_files()

    # Enregistrer les blueprints
    app.register_blueprint(pages_bp)
    app.register_blueprint(cavaliers_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(stats_bp)

    return app

if __name__ == '__main__':
    app = create_app()

    print("🐴 Serveur démarré sur http://localhost:4000")
    print("📊 Statistiques disponibles sur http://localhost:4000/stats.html")
    print("👥 Gestion cavaliers sur http://localhost:4000/cavaliers.html")

   # app.run(
   #     debug=Config.DEBUG,
   #     host=Config.HOST,
   #     port=Config.PORT
   # )
   # gunicorn -w 4 -b 0.0.0.0:8000 app:app
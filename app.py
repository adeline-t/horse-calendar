from flask import Flask
from config import Config
from services.data_service import DataService

# Import blueprints.
from routes.pages import pages_bp
from routes.riders import riders_bp
from routes.assignments import assignments_bp
from routes.stats import stats_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Initialize data directories and files.
    Config.init_directories()
    DataService.init_files()

    # Register blueprints.
    app.register_blueprint(pages_bp)
    app.register_blueprint(riders_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(stats_bp)

    return app

# Expose the application instance to Gunicorn.
app = create_app()

if __name__ == '__main__':
    print("🐴 Serveur démarré sur http://localhost:5000")
    print("📊 Statistiques disponibles sur http://localhost:5000/stats.html")
    print("👥 Gestion cavaliers sur http://localhost:5000/riders.html")

    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=Config.PORT
    )

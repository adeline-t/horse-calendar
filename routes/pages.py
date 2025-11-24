from flask import Blueprint, render_template

pages_bp = Blueprint('pages', __name__)

@pages_bp.route('/')
def index():
    return render_template('index.html')

@pages_bp.route('/cavaliers.html')
def cavaliers_page():
    return render_template('cavaliers.html')

@pages_bp.route('/stats.html')
def stats_page():
    return render_template('stats.html')

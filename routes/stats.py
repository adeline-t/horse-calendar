from flask import Blueprint, jsonify, request
from services.data_service import DataService

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('', methods=['GET'])
def get_stats():
    """Récupérer les statistiques"""
    try:
        month = request.args.get('month')
        year = request.args.get('year')

        assignments = DataService.read_assignments()
        cavaliers_data = DataService.read_cavaliers()

        stats = {}
        work_types_count = {}

        for date_key, data in assignments.items():
            # Filtrer par mois/année si spécifié
            if month and year:
                date_parts = date_key.split('-')
                if len(date_parts) == 3:
                    if date_parts[0] != year or date_parts[1] != month:
                        continue

            cavaliers = data.get('cavaliers', [])
            work_type = data.get('work_type', '')

            for cavalier in cavaliers:
                if cavalier not in stats:
                    stats[cavalier] = 0
                stats[cavalier] += 1

            if work_type:
                if work_type not in work_types_count:
                    work_types_count[work_type] = 0
                work_types_count[work_type] += 1

        return jsonify({
            'cavalier_stats': stats,
            'work_types': work_types_count,
            'cavaliers_data': cavaliers_data
        })
    except Exception as e:
        print(f"Erreur get_stats: {e}")
        return jsonify({'error': str(e)}), 500

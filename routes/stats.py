from flask import Blueprint, jsonify, request
from services.data_service import DataService

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('', methods=['GET'])
def get_stats():
    """Return schedule statistics."""
    try:
        month = request.args.get('month')
        year = request.args.get('year')

        assignments = DataService.read_assignments()
        riders_data = DataService.read_riders()

        stats = {}
        work_types_count = {}

        for date_key, data in assignments.items():
            # Filter by month and year when both are provided.
            if month and year:
                date_parts = date_key.split('-')
                if len(date_parts) == 3:
                    if date_parts[0] != year or date_parts[1] != month:
                        continue

            for task in data.get('tasks', []):
                rider = task.get('rider', '')
                work_type = task.get('work_type', '')

                if rider:
                    stats[rider] = stats.get(rider, 0) + 1

                if work_type:
                    work_types_count[work_type] = work_types_count.get(work_type, 0) + 1

        return jsonify({
            'rider_stats': stats,
            'work_types': work_types_count,
            'riders_data': riders_data
        })
    except Exception as e:
        print(f"Error in get_stats: {e}")
        return jsonify({'error': str(e)}), 500

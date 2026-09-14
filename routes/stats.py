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

        rider_days = {}
        work_type_counts = {}

        for date_key, data in assignments.items():
            # Filter by month and year when both are provided.
            if month and year:
                date_parts = date_key.split('-')
                if len(date_parts) == 3:
                    if date_parts[0] != year or date_parts[1] != month:
                        continue

            for assignment in data.get('assignments', []):
                rider = assignment.get('rider', '')
                work_type = assignment.get('work_type', '')

                if rider:
                    rider_days.setdefault(rider, set()).add(date_key)

                if work_type:
                    work_type_counts[work_type] = work_type_counts.get(work_type, 0) + 1

        rider_day_counts = {
            rider: len(days)
            for rider, days in rider_days.items()
        }

        return jsonify({
            'rider_day_counts': rider_day_counts,
            'work_type_counts': work_type_counts,
            'riders_data': riders_data
        })
    except Exception as e:
        print(f"Error in get_stats: {e}")
        return jsonify({'error': str(e)}), 500

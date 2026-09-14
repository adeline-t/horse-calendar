from flask import Blueprint, jsonify, request
from services.data_service import DataService

assignments_bp = Blueprint('assignments', __name__, url_prefix='/api/assignments')

@assignments_bp.route('', methods=['GET'])
def get_assignments():
    """Return all assignments."""
    try:
        assignments = DataService.read_assignments()
        return jsonify(assignments)
    except Exception as e:
        print(f"Error in get_assignments: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('', methods=['POST'])
def save_assignments():
    """Replace all assignments for a date."""
    try:
        data = request.get_json() or {}
        date = data.get('date')

        if not date:
            return jsonify({'error': 'La date est requise'}), 400

        assignments = DataService.read_assignments()

        raw_assignments = data.get('assignments', []) or []
        cleaned_assignments = []

        for assignment in raw_assignments:
            if not isinstance(assignment, dict):
                continue

            rider = (assignment.get('rider') or '').strip()
            work_type = (assignment.get('work_type') or '').strip()
            comment = (assignment.get('comment') or '').strip()

            if not work_type:
                continue

            cleaned_assignments.append({
                'rider': rider or None,
                'work_type': work_type,
                'comment': comment
            })

        if not cleaned_assignments:
            if date in assignments:
                del assignments[date]
                print(f"Deleted assignment for {date}")
        else:
            assignments[date] = {
                'assignments': cleaned_assignments
            }
            print(f"Saved assignment for {date}: {assignments[date]}")

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in save_assignments: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>', methods=['POST'])
def add_assignment(date):
    """Add one rider/work type/comment assignment to a date."""
    try:
        data = request.get_json() or {}
        rider = (data.get('rider') or '').strip()
        work_type = (data.get('work_type') or '').strip()
        comment = (data.get('comment') or '').strip()

        if not work_type:
            return jsonify({'error': 'Le type de travail est requis'}), 400

        assignments = DataService.read_assignments()

        if date not in assignments:
            assignments[date] = {'assignments': []}

        day_assignments = assignments[date].get('assignments', [])
        for assignment in day_assignments:
            if (
                (assignment.get('rider') or '') == rider
                and assignment.get('work_type') == work_type
                and (assignment.get('comment') or '').strip() == comment
            ):
                return jsonify({'error': 'Cette activité existe déjà'}), 400

        day_assignments.append({
            'rider': rider or None,
            'work_type': work_type,
            'comment': comment
        })

        assignments[date]['assignments'] = day_assignments

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Added assignment for {date}: {rider or 'no rider'} - {work_type}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in add_assignment: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>/<int:assignment_index>', methods=['DELETE'])
def remove_assignment(date, assignment_index):
    """Remove an assignment by index."""
    try:
        assignments = DataService.read_assignments()

        if date not in assignments or 'assignments' not in assignments[date]:
            return jsonify({'error': 'Aucune activité pour cette date'}), 400

        day_assignments = assignments[date]['assignments']
        if assignment_index < 0 or assignment_index >= len(day_assignments):
            return jsonify({'error': 'Index invalide'}), 400

        day_assignments.pop(assignment_index)

        if not day_assignments:
            del assignments[date]
            print(f"Deleted assignment for {date}")
        else:
            assignments[date]['assignments'] = day_assignments

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Removed assignment at index {assignment_index} for {date}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in remove_assignment: {e}")
        return jsonify({'error': str(e)}), 500

from flask import Blueprint, jsonify, request
from services.data_service import DataService

assignments_bp = Blueprint('assignments', __name__, url_prefix='/api/assignments')

@assignments_bp.route('', methods=['GET'])
def get_assignments():
    """Récupérer tous les assignments"""
    try:
        assignments = DataService.read_assignments()
        return jsonify(assignments)
    except Exception as e:
        print(f"Erreur get_assignments: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('', methods=['POST'])
def save_assignment():
    """Sauvegarder un assignment"""
    try:
        data = request.get_json()
        date = data.get('date')
        cavaliers = data.get('cavaliers', [])
        comment = data.get('comment', '')
        work_type = data.get('work_type', '')

        if not date:
            return jsonify({'error': 'La date est requise'}), 400

        if not isinstance(cavaliers, list):
            return jsonify({'error': 'cavaliers doit être une liste'}), 400

        assignments = DataService.read_assignments()

        # Si aucun cavalier et pas de commentaire/type, supprimer l'entrée
        if (not cavaliers or len(cavaliers) == 0) and not comment and not work_type:
            if date in assignments:
                del assignments[date]
                print(f"Suppression de l'entrée pour {date}")
        else:
            assignments[date] = {
                'cavaliers': cavaliers,
                'comment': comment,
                'work_type': work_type
            }
            print(f"Sauvegarde pour {date}: {assignments[date]}")

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Erreur save_assignment: {e}")
        return jsonify({'error': str(e)}), 500

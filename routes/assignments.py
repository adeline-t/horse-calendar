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
        data = request.get_json() or {}
        date = data.get('date')

        if not date:
            return jsonify({'error': 'La date est requise'}), 400

        assignments = DataService.read_assignments()

        raw_tasks = data.get('tasks', []) or []
        cleaned_tasks = []

        for task in raw_tasks:
            if not isinstance(task, dict):
                continue

            cavalier = (task.get('cavalier') or '').strip()
            work_type = (task.get('work_type') or '').strip()
            task_comment = task.get('comment', '')

            if not cavalier or not work_type:
                continue

            cleaned_tasks.append({
                'cavalier': cavalier,
                'work_type': work_type,
                'comment': task_comment or ''
            })

        if (not cleaned_tasks):
            if date in assignments:
                del assignments[date]
                print(f"Suppression de l'entrée pour {date}")
        else:
            assignments[date] = {
                'tasks': cleaned_tasks
            }
            print(f"Sauvegarde pour {date}: {assignments[date]}")

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Erreur save_assignment: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>/tasks', methods=['POST'])
def add_task(date):
    """Ajouter une tâche (cavalier + work_type + commentaire optionnel) pour une date"""
    try:
        data = request.get_json() or {}
        cavalier = (data.get('cavalier') or '').strip()
        work_type = (data.get('work_type') or '').strip()
        comment = data.get('comment', '')

        if not cavalier or not work_type:
            return jsonify({'error': 'cavalier et work_type sont requis'}), 400

        assignments = DataService.read_assignments()

        if date not in assignments:
            assignments[date] = {'tasks': []}

        tasks = assignments[date].get('tasks', [])
        for task in tasks:
            if task.get('cavalier') == cavalier and task.get('work_type') == work_type:
                return jsonify({'error': 'Cette tâche existe déjà'}), 400

        tasks.append({
            'cavalier': cavalier,
            'work_type': work_type,
            'comment': comment or ''
        })

        assignments[date]['tasks'] = tasks

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Tâche ajoutée pour {date}: {cavalier} - {work_type}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Erreur add_task: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>/tasks/<int:task_index>', methods=['DELETE'])
def remove_task(date, task_index):
    """Supprimer une tâche par son index"""
    try:
        assignments = DataService.read_assignments()

        if date not in assignments or 'tasks' not in assignments[date]:
            return jsonify({'error': 'Aucune tâche pour cette date'}), 400

        tasks = assignments[date]['tasks']
        if task_index < 0 or task_index >= len(tasks):
            return jsonify({'error': 'Index invalide'}), 400

        tasks.pop(task_index)

        if len(tasks) == 0:
            del assignments[date]
            print(f"Suppression de l'entrée pour {date}")
        else:
            assignments[date]['tasks'] = tasks

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Tâche supprimée pour {date} index {task_index}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Erreur remove_task: {e}")
        return jsonify({'error': str(e)}), 500

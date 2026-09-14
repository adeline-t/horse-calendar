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
def save_assignment():
    """Save the tasks assigned to a date."""
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

            rider = (task.get('rider') or '').strip()
            work_type = (task.get('work_type') or '').strip()
            task_comment = task.get('comment', '')

            if not rider or not work_type:
                continue

            cleaned_tasks.append({
                'rider': rider,
                'work_type': work_type,
                'comment': task_comment or ''
            })

        if (not cleaned_tasks):
            if date in assignments:
                del assignments[date]
                print(f"Deleted assignment for {date}")
        else:
            assignments[date] = {
                'tasks': cleaned_tasks
            }
            print(f"Saved assignment for {date}: {assignments[date]}")

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in save_assignment: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>/tasks', methods=['POST'])
def add_task(date):
    """Add a rider, work type, and optional comment to a date."""
    try:
        data = request.get_json() or {}
        rider = (data.get('rider') or '').strip()
        work_type = (data.get('work_type') or '').strip()
        comment = data.get('comment', '')

        if not rider or not work_type:
            return jsonify({'error': 'Le cavalier et le type de travail sont requis'}), 400

        assignments = DataService.read_assignments()

        if date not in assignments:
            assignments[date] = {'tasks': []}

        tasks = assignments[date].get('tasks', [])
        for task in tasks:
            if task.get('rider') == rider and task.get('work_type') == work_type:
                return jsonify({'error': 'Cette tâche existe déjà'}), 400

        tasks.append({
            'rider': rider,
            'work_type': work_type,
            'comment': comment or ''
        })

        assignments[date]['tasks'] = tasks

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Added task for {date}: {rider} - {work_type}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in add_task: {e}")
        return jsonify({'error': str(e)}), 500

@assignments_bp.route('/<date>/tasks/<int:task_index>', methods=['DELETE'])
def remove_task(date, task_index):
    """Remove a task by index."""
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
            print(f"Deleted assignment for {date}")
        else:
            assignments[date]['tasks'] = tasks

        if not DataService.write_assignments(assignments):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Removed task at index {task_index} for {date}")
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        print(f"Error in remove_task: {e}")
        return jsonify({'error': str(e)}), 500

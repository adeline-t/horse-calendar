from flask import Blueprint, jsonify, request
from services.data_service import DataService
from services.validation import ValidationService

riders_bp = Blueprint('riders', __name__, url_prefix='/api/riders')

@riders_bp.route('', methods=['GET'])
def get_riders():
    """Return all riders."""
    try:
        riders = DataService.read_riders()
        return jsonify(riders)
    except Exception as e:
        print(f"Error in get_riders: {e}")
        return jsonify({'error': str(e)}), 500


@riders_bp.route('/active', methods=['GET'])
def get_active_riders():
    """Return riders who are active on a given date."""
    try:
        date_str = request.args.get('date', '')  # YYYY-MM-DD
        riders = DataService.read_riders()

        if not isinstance(riders, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if not date_str:
            # Return all riders when no date is provided.
            return jsonify(riders)

        # Filter riders by their active date range.
        active_riders = []
        for rider in riders:
            if not isinstance(rider, dict):
                continue

            start_date = rider.get('start_date', '')
            end_date = rider.get('end_date', '')

            # A rider without dates is always active.
            if not start_date and not end_date:
                active_riders.append(rider)
                continue

            # Check whether the requested date is in range.
            is_active = True

            if start_date and date_str < start_date:
                is_active = False

            if end_date and date_str > end_date:
                is_active = False

            if is_active:
                active_riders.append(rider)

        return jsonify(active_riders)
    except Exception as e:
        print(f"Error in get_active_riders: {e}")
        return jsonify({'error': str(e)}), 500


@riders_bp.route('', methods=['POST'])
def add_rider():
    """Add a new rider."""
    try:
        data = request.get_json()

        # Validate the request.
        valid, error = ValidationService.validate_rider_data(data)
        if not valid:
            return jsonify({'error': error}), 400

        riders = DataService.read_riders()

        if not isinstance(riders, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        # Reject duplicate rider names.
        name = data['name'].strip()
        for rider in riders:
            if not isinstance(rider, dict) or 'name' not in rider:
                return jsonify({'error': 'Format de données cavaliers invalide'}), 500
            if rider['name'].lower() == name.lower():
                return jsonify({'error': 'Ce cavalier existe déjà'}), 400

        # Add and persist the rider.
        new_rider = {
            'name': name,
            'color': data.get('color', '#667eea'),
            'start_date': data.get('start_date', ''),
            'end_date': data.get('end_date', '')
        }
        riders.append(new_rider)

        if not DataService.write_riders(riders):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Added rider: {new_rider}")
        return jsonify({'success': True, 'riders': riders})
    except Exception as e:
        print(f"Error in add_rider: {e}")
        return jsonify({'error': str(e)}), 500

@riders_bp.route('/<int:index>', methods=['DELETE'])
def delete_rider(index):
    """Delete a rider by index."""
    try:
        riders = DataService.read_riders()

        if not isinstance(riders, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if 0 <= index < len(riders):
            deleted = riders.pop(index)

            if not DataService.write_riders(riders):
                return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

            print(f"Deleted rider: {deleted}")
            return jsonify({'success': True, 'riders': riders})
        else:
            return jsonify({'error': 'Index invalide'}), 400
    except Exception as e:
        print(f"Error in delete_rider: {e}")
        return jsonify({'error': str(e)}), 500

@riders_bp.route('/<int:index>', methods=['PUT'])
def update_rider(index):
    """Update a rider by index."""
    try:
        data = request.get_json()
        riders = DataService.read_riders()

        if not isinstance(riders, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if not (0 <= index < len(riders)):
            return jsonify({'error': 'Index invalide'}), 400

        if not isinstance(riders[index], dict):
            return jsonify({'error': 'Format de cavalier invalide'}), 500

        # Update the supplied fields.
        if 'color' in data:
            valid, error = ValidationService.validate_color(data['color'])
            if not valid:
                return jsonify({'error': error}), 400
            riders[index]['color'] = data['color']

        if 'name' in data:
            valid, error = ValidationService.validate_rider_name(data['name'])
            if not valid:
                return jsonify({'error': error}), 400

            name = data['name'].strip()
            # Ensure the new name is unique.
            for rider_index, rider in enumerate(riders):
                if rider_index != index and isinstance(rider, dict) and rider.get('name', '').lower() == name.lower():
                    return jsonify({'error': 'Ce nom existe déjà'}), 400

            riders[index]['name'] = name

        if 'start_date' in data:
            valid, error = ValidationService.validate_date(data['start_date'])
            if not valid:
                return jsonify({'error': error}), 400
            riders[index]['start_date'] = data['start_date']

        if 'end_date' in data:
            valid, error = ValidationService.validate_date(data['end_date'])
            if not valid:
                return jsonify({'error': error}), 400
            riders[index]['end_date'] = data['end_date']

        # Validate the date range after applying updates.
        valid, error = ValidationService.validate_date_range(
            riders[index].get('start_date', ''),
            riders[index].get('end_date', '')
        )
        if not valid:
            return jsonify({'error': error}), 400

        if not DataService.write_riders(riders):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Updated rider: {riders[index]}")
        return jsonify({'success': True, 'riders': riders})
    except Exception as e:
        print(f"Error in update_rider: {e}")
        return jsonify({'error': str(e)}), 500

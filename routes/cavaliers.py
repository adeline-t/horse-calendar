from flask import Blueprint, jsonify, request
from services.data_service import DataService
from services.validation import ValidationService

cavaliers_bp = Blueprint('cavaliers', __name__, url_prefix='/api/cavaliers')

@cavaliers_bp.route('', methods=['GET'])
def get_cavaliers():
    """Récupérer tous les cavaliers"""
    try:
        cavaliers = DataService.read_cavaliers()
        return jsonify(cavaliers)
    except Exception as e:
        print(f"Erreur get_cavaliers: {e}")
        return jsonify({'error': str(e)}), 500


@cavaliers_bp.route('/active', methods=['GET'])
def get_active_cavaliers():
    """Récupérer les cavaliers actifs pour une date donnée"""
    try:
        date_str = request.args.get('date', '')  # Format: YYYY-MM-DD
        cavaliers = DataService.read_cavaliers()

        if not isinstance(cavaliers, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if not date_str:
            # Si pas de date, retourner tous les cavaliers
            return jsonify(cavaliers)

        # Filtrer par date
        active_cavaliers = []
        for c in cavaliers:
            if not isinstance(c, dict):
                continue

            start_date = c.get('start_date', '')
            end_date = c.get('end_date', '')

            # Si pas de dates définies, le cavalier est toujours actif
            if not start_date and not end_date:
                active_cavaliers.append(c)
                continue

            # Vérifier si la date est dans la plage
            is_active = True

            if start_date and date_str < start_date:
                is_active = False

            if end_date and date_str > end_date:
                is_active = False

            if is_active:
                active_cavaliers.append(c)

        return jsonify(active_cavaliers)
    except Exception as e:
        print(f"Erreur get_active_cavaliers: {e}")
        return jsonify({'error': str(e)}), 500


@cavaliers_bp.route('', methods=['POST'])
def add_cavalier():
    """Ajouter un nouveau cavalier"""
    try:
        data = request.get_json()

        # Validation
        valid, error = ValidationService.validate_cavalier_data(data)
        if not valid:
            return jsonify({'error': error}), 400

        cavaliers = DataService.read_cavaliers()

        if not isinstance(cavaliers, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        # Vérifier si le cavalier existe déjà
        name = data['name'].strip()
        for c in cavaliers:
            if not isinstance(c, dict) or 'name' not in c:
                return jsonify({'error': 'Format de données cavaliers invalide'}), 500
            if c['name'].lower() == name.lower():
                return jsonify({'error': 'Ce cavalier existe déjà'}), 400

        # Ajouter le nouveau cavalier
        new_cavalier = {
            'name': name,
            'color': data.get('color', '#667eea'),
            'start_date': data.get('start_date', ''),
            'end_date': data.get('end_date', '')
        }
        cavaliers.append(new_cavalier)

        # Sauvegarder
        if not DataService.write_cavaliers(cavaliers):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Cavalier ajouté: {new_cavalier}")
        return jsonify({'success': True, 'cavaliers': cavaliers})
    except Exception as e:
        print(f"Erreur add_cavalier: {e}")
        return jsonify({'error': str(e)}), 500

@cavaliers_bp.route('/<int:index>', methods=['DELETE'])
def delete_cavalier(index):
    """Supprimer un cavalier"""
    try:
        cavaliers = DataService.read_cavaliers()

        if not isinstance(cavaliers, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if 0 <= index < len(cavaliers):
            deleted = cavaliers.pop(index)

            if not DataService.write_cavaliers(cavaliers):
                return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

            print(f"Cavalier supprimé: {deleted}")
            return jsonify({'success': True, 'cavaliers': cavaliers})
        else:
            return jsonify({'error': 'Index invalide'}), 400
    except Exception as e:
        print(f"Erreur delete_cavalier: {e}")
        return jsonify({'error': str(e)}), 500

@cavaliers_bp.route('/<int:index>', methods=['PUT'])
def update_cavalier(index):
    """Mettre à jour un cavalier"""
    try:
        data = request.get_json()
        cavaliers = DataService.read_cavaliers()

        if not isinstance(cavaliers, list):
            return jsonify({'error': 'Format de données invalide'}), 500

        if not (0 <= index < len(cavaliers)):
            return jsonify({'error': 'Index invalide'}), 400

        if not isinstance(cavaliers[index], dict):
            return jsonify({'error': 'Format de cavalier invalide'}), 500

        # Mettre à jour les champs fournis
        if 'color' in data:
            valid, error = ValidationService.validate_color(data['color'])
            if not valid:
                return jsonify({'error': error}), 400
            cavaliers[index]['color'] = data['color']

        if 'name' in data:
            valid, error = ValidationService.validate_cavalier_name(data['name'])
            if not valid:
                return jsonify({'error': error}), 400

            name = data['name'].strip()
            # Vérifier que le nouveau nom n'existe pas déjà
            for i, c in enumerate(cavaliers):
                if i != index and isinstance(c, dict) and c.get('name', '').lower() == name.lower():
                    return jsonify({'error': 'Ce nom existe déjà'}), 400

            cavaliers[index]['name'] = name

        if 'start_date' in data:
            valid, error = ValidationService.validate_date(data['start_date'])
            if not valid:
                return jsonify({'error': error}), 400
            cavaliers[index]['start_date'] = data['start_date']

        if 'end_date' in data:
            valid, error = ValidationService.validate_date(data['end_date'])
            if not valid:
                return jsonify({'error': error}), 400
            cavaliers[index]['end_date'] = data['end_date']

        # Validation des dates après mise à jour
        valid, error = ValidationService.validate_date_range(
            cavaliers[index].get('start_date', ''),
            cavaliers[index].get('end_date', '')
        )
        if not valid:
            return jsonify({'error': error}), 400

        # Sauvegarder
        if not DataService.write_cavaliers(cavaliers):
            return jsonify({'error': 'Erreur lors de la sauvegarde'}), 500

        print(f"Cavalier mis à jour: {cavaliers[index]}")
        return jsonify({'success': True, 'cavaliers': cavaliers})
    except Exception as e:
        print(f"Erreur update_cavalier: {e}")
        return jsonify({'error': str(e)}), 500

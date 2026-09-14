class ValidationService:
    """Validate API input data."""

    @staticmethod
    def validate_rider_name(name):
        """Validate a rider name."""
        if not name or not isinstance(name, str):
            return False, "Le nom est requis et doit être une chaîne"
        if not name.strip():
            return False, "Le nom ne peut pas être vide"
        return True, None

    @staticmethod
    def validate_color(color):
        """Validate a hexadecimal color."""
        if not isinstance(color, str) or not color.startswith('#'):
            return False, "Format de couleur invalide"
        if len(color) != 7:
            return False, "La couleur doit être au format #RRGGBB"
        return True, None

    @staticmethod
    def validate_date(date_str):
        """Validate a date in YYYY-MM-DD format."""
        if not date_str:
            return True, None  # Empty dates are allowed.

        if not isinstance(date_str, str):
            return False, "La date doit être une chaîne"

        parts = date_str.split('-')
        if len(parts) != 3:
            return False, "Format de date invalide (YYYY-MM-DD attendu)"

        try:
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            if not (1900 <= year <= 2100):
                return False, "Année invalide"
            if not (1 <= month <= 12):
                return False, "Mois invalide"
            if not (1 <= day <= 31):
                return False, "Jour invalide"
        except ValueError:
            return False, "Format de date invalide"

        return True, None

    @staticmethod
    def validate_date_range(start_date, end_date):
        """Validate a date range."""
        if start_date and end_date and start_date > end_date:
            return False, "La date de fin doit être après la date de début"
        return True, None

    @staticmethod
    def validate_rider_data(data):
        """Validate all rider fields."""
        # Name
        valid, error = ValidationService.validate_rider_name(data.get('name', ''))
        if not valid:
            return False, error

        # Color
        valid, error = ValidationService.validate_color(data.get('color', '#667eea'))
        if not valid:
            return False, error

        # Dates
        start_date = data.get('start_date', '')
        end_date = data.get('end_date', '')

        valid, error = ValidationService.validate_date(start_date)
        if not valid:
            return False, error

        valid, error = ValidationService.validate_date(end_date)
        if not valid:
            return False, error

        valid, error = ValidationService.validate_date_range(start_date, end_date)
        if not valid:
            return False, error

        return True, None

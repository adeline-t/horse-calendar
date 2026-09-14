# Horse Calendar

A Flask web application for scheduling horse training and tracking riders' sessions in a monthly calendar.

## Features

- Monthly schedule view
- Multiple work types for each rider on a given date
- One-off rider entries directly from the schedule
- Rider management, including colors and active periods
- Monthly statistics by rider and work type
- Simple JSON file storage

## Requirements

- Python 3.11 or later
- `pip`

## Installation

```bash
git clone https://github.com/adeline-t/horse-calendar.git
cd horse-calendar
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

On Windows, activate the virtual environment with:

```powershell
.venv\Scripts\activate
```

## Running locally

```bash
python app.py
```

The application will be available at <http://localhost:5000>.

| Page | Address |
| --- | --- |
| Planning | <http://localhost:5000/> |
| Gestion des cavaliers | <http://localhost:5000/riders.html> |
| Statistiques | <http://localhost:5000/stats.html> |

The page names above match the labels displayed in the application.

## Data storage

Application data is stored in:

- `data/riders.json` for riders
- `data/assignments.json` for scheduled tasks

These files are created automatically on first launch if they do not exist. The application process must have permission to write to them. Back them up before updating or redeploying the application.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/riders` | Lists all riders |
| `GET` | `/api/riders/active?date=YYYY-MM-DD` | Lists riders active on a given date |
| `POST` | `/api/riders` | Adds a rider |
| `PUT` | `/api/riders/<index>` | Updates a rider |
| `DELETE` | `/api/riders/<index>` | Deletes a rider |
| `GET` | `/api/assignments` | Returns the complete schedule |
| `POST` | `/api/assignments` | Saves the tasks for a date |
| `POST` | `/api/assignments/<date>/tasks` | Adds a task to a date |
| `DELETE` | `/api/assignments/<date>/tasks/<index>` | Deletes a task |
| `GET` | `/api/stats?month=MM&year=YYYY` | Returns statistics |

Write requests use JSON. For example, to add a task:

```bash
curl -X POST http://localhost:5000/api/assignments/2026-09-14/tasks \
  -H "Content-Type: application/json" \
  -d '{"rider":"Alice","work_type":"dressage","comment":"Light session"}'
```

## Deployment

The `render.yaml` file contains the configuration required to deploy the application on Render. Production uses Gunicorn:

```bash
gunicorn -w 4 app:app
```

The application stores data on the local filesystem. On a platform with an ephemeral disk, changes may be lost during a redeployment. For durable or concurrent use, attach persistent storage or replace the JSON files with a database.

## Project structure

```text
horse-calendar/
├── app.py                 # Creates and starts the Flask application
├── config.py              # Configuration and data paths
├── routes/                # Pages and API endpoints
├── services/              # Data access and validation
├── static/                # JavaScript and styles
├── templates/             # HTML pages
└── data/                  # JSON data
```

## License

This project is distributed under the license provided in [LICENSE](LICENSE).

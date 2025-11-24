const API_URL = '/api';
let currentDate = new Date();
let selectedDate = null;
let allAssignments = {};
let allCavaliers = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadData();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Modal
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Bouton enregistrer commentaire
    document.getElementById('saveCommentBtn').addEventListener('click', saveComment);

    // Change work type
    document.getElementById('workTypeSelect').addEventListener('change', saveWorkType);
});

async function loadData() {
    await loadCavaliers();
    await loadAssignments();
}

async function loadCavaliers() {
    try {
        const response = await fetch(API_URL + '/cavaliers');
        allCavaliers = await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement des cavaliers:', error);
    }
}

async function loadAssignments() {
    try {
        const response = await fetch(API_URL + '/assignments');
        allAssignments = await response.json();
        renderCalendar();
    } catch (error) {
        console.error('Erreur lors du chargement des assignations:', error);
    }
}

function getDateKey(year, month, day) {
    const monthNum = month + 1;
    const monthStr = monthNum < 10 ? '0' + monthNum : '' + monthNum;
    const dayStr = day < 10 ? '0' + day : '' + day;
    return year + '-' + monthStr + '-' + dayStr;
}

function getCavalierColor(cavalierName) {
    const cavalier = allCavaliers.find(c => c.name === cavalierName);
    return cavalier ? cavalier.color : '#667eea';
}

function getWorkTypeIcon(workType) {
    const icons = {
        'longe': '💫',
        'liberte': '🐎',
        'repos': '💤',
        'plat': '🎠',
        'cso': '🚧',
        'balade': '🌳',
        'tap': '🥕'
    };
    return icons[workType] || '';
}

function getWorkTypeLabel(workType) {
    const labels = {
        'longe': 'Longe',
        'liberte': 'Liberté',
        'repos': 'Repos',
        'plat': 'Dressage',
        'cso': 'CSO',
        'balade': 'Balade',
        'tap': 'TAP'
    };
    return labels[workType] || workType;
}
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    monthYear.textContent = months[month] + ' ' + year;

    calendar.innerHTML = '';

    const dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = year - 1;
    }
    const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
        createDayElement(prevMonthDays - i, true, prevYear, prevMonth);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        createDayElement(day, false, year, month);
    }

    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
    }

    const totalCells = calendar.children.length - 7;
    const remainingCells = 42 - totalCells - 7;

    for (let day = 1; day <= remainingCells; day++) {
        createDayElement(day, true, nextYear, nextMonth);
    }
}

function createDayElement(day, isOtherMonth, year, month) {
    const calendar = document.getElementById('calendar');
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    if (isOtherMonth) dayDiv.classList.add('other-month');

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    const dateKey = getDateKey(year, month, day);
    const assignments = allAssignments[dateKey];

    if (assignments) {
        // Type de travail
        if (assignments.work_type) {
            const workBadge = document.createElement('div');
            workBadge.className = 'work-type-badge';
            workBadge.textContent = getWorkTypeIcon(assignments.work_type) + ' ' + getWorkTypeLabel(assignments.work_type);
            dayDiv.appendChild(workBadge);
        }

        // Cavaliers
        if (assignments.cavaliers && assignments.cavaliers.length > 0) {
            assignments.cavaliers.forEach((cavalier, index) => {
                const badge = document.createElement('div');
                badge.className = 'cavalier-badge';
                badge.style.backgroundColor = getCavalierColor(cavalier);

                const nameSpan = document.createElement('span');
                nameSpan.textContent = cavalier;
                badge.appendChild(nameSpan);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = '×';
                removeBtn.onclick = function(event) {
                    event.stopPropagation();
                    removeCavalierFromDay(dateKey, index);
                };
                badge.appendChild(removeBtn);

                dayDiv.appendChild(badge);
            });
        }

        // Indicateur commentaire
        if (assignments.comment) {
            const commentIndicator = document.createElement('div');
            commentIndicator.style.fontSize = '12px';
            commentIndicator.style.marginTop = '5px';
            commentIndicator.textContent = '💬';
            dayDiv.appendChild(commentIndicator);
        }
    }

    dayDiv.addEventListener('click', () => {
        if (!isOtherMonth) {
            openModal(day, month, year);
        }
    });

    calendar.appendChild(dayDiv);
}

async function openModal(day, month, year) {
    const modal = document.getElementById('modal');
    const modalDate = document.getElementById('modalDate');

    selectedDate = getDateKey(year, month, day);

    const date = new Date(year, month, day);
    modalDate.textContent = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Charger le type de travail
    const workTypeSelect = document.getElementById('workTypeSelect');
    workTypeSelect.value = allAssignments[selectedDate]?.work_type || '';

    // Charger le commentaire
    const commentText = document.getElementById('commentText');
    commentText.value = allAssignments[selectedDate]?.comment || '';

    displayAssignedCavaliers();
    await loadCavalierButtons();

    modal.style.display = 'block';
}

async function loadCavalierButtons() {
    try {
        // Récupérer les cavaliers actifs pour la date sélectionnée
        const response = await fetch(API_URL + '/cavaliers/active?date=' + selectedDate);
        const cavaliers = await response.json();

        const buttonsDiv = document.getElementById('cavalierButtons');
        buttonsDiv.innerHTML = '';

        if (cavaliers.length === 0) {
            buttonsDiv.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucun cavalier actif pour cette date</p>';
            return;
        }

        // Récupérer les cavaliers déjà assignés
        const assignedCavaliers = allAssignments[selectedDate]?.cavaliers || [];

        cavaliers.forEach(cavalier => {
            const isAssigned = assignedCavaliers.includes(cavalier.name);

            const button = document.createElement('button');
            button.className = 'cavalier-btn' + (isAssigned ? ' assigned' : '');
            button.style.borderLeft = '4px solid ' + (cavalier.color || '#667eea');
            button.textContent = cavalier.name;
            button.disabled = isAssigned;

            if (!isAssigned) {
                button.addEventListener('click', () => addCavalierToDay(cavalier.name));
            }

            buttonsDiv.appendChild(button);
        });
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

function displayAssignedCavaliers() {
    const container = document.getElementById('assignedCavaliers');
    const assignments = allAssignments[selectedDate];

    container.innerHTML = '<h4>Cavaliers du jour :</h4>';

    if (!assignments || !assignments.cavaliers || assignments.cavaliers.length === 0) {
        container.innerHTML += '<div class="empty-message">Aucun cavalier assigné</div>';
        return;
    }

    assignments.cavaliers.forEach((cavalier, index) => {
        const item = document.createElement('div');
        item.className = 'assigned-cavalier-item';
        item.style.backgroundColor = getCavalierColor(cavalier);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = cavalier;
        item.appendChild(nameSpan);

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-icon';
        removeIcon.textContent = '×';
                removeIcon.onclick = () => removeCavalierFromDay(selectedDate, index);
        item.appendChild(removeIcon);

        container.appendChild(item);
    });
}

async function addCavalierToDay(cavalier) {
    try {
        let cavaliers = [];
        if (allAssignments[selectedDate] && allAssignments[selectedDate].cavaliers) {
            cavaliers = allAssignments[selectedDate].cavaliers.slice();
        }

        if (cavaliers.includes(cavalier)) {
            alert('Ce cavalier est déjà assigné à ce jour');
            return;
        }

        cavaliers.push(cavalier);

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: allAssignments[selectedDate]?.comment || '',
                work_type: allAssignments[selectedDate]?.work_type || ''
            })
        });

        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedCavaliers();
            loadCavalierButtons();
            renderCalendar();
        } else {
            alert('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function removeCavalierFromDay(date, index) {
    try {
        let cavaliers = allAssignments[date].cavaliers.slice();
        cavaliers.splice(index, 1);

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                cavaliers: cavaliers,
                comment: allAssignments[date]?.comment || '',
                work_type: allAssignments[date]?.work_type || ''
            })
        });

        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;

            if (selectedDate === date) {
                displayAssignedCavaliers();
                loadCavalierButtons();
            }

            renderCalendar();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function saveComment() {
    try {
        const comment = document.getElementById('commentText').value.trim();

        const cavaliers = allAssignments[selectedDate]?.cavaliers || [];
        const work_type = allAssignments[selectedDate]?.work_type || '';

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: comment,
                work_type: work_type
            })
        });

        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            renderCalendar();
            alert('Commentaire enregistré !');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function saveWorkType() {
    try {
        const workType = document.getElementById('workTypeSelect').value;

        const cavaliers = allAssignments[selectedDate]?.cavaliers || [];
        const comment = allAssignments[selectedDate]?.comment || '';

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: comment,
                work_type: workType
            })
        });

        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            renderCalendar();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}


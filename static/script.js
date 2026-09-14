const API_URL = '/api';
let currentDate = new Date();
let selectedDate = null;
let allAssignments = {};
let allRiders = [];
let colorByName = new Map();
let selectedAssignmentRider = null;
let selectedAssignmentWorkType = null;

// ===== INITIALISATION =====
function initializeWorkTypeButtons() {
    const container = document.getElementById('assignmentWorkTypeButtons');
    if (!container) return;

    Object.entries(WORK_TYPES).forEach(([key, value]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'assignment-choice work-type-choice';
        button.setAttribute('aria-pressed', 'false');
        button.dataset.value = key;
        button.innerHTML = `<span aria-hidden="true">${value.icon}</span><span>${value.label}</span>`;
        button.addEventListener('click', () => selectAssignmentChoice(
            container,
            button,
            'workType'
        ));
        container.appendChild(button);
    });
}


function initializeApp() {
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
}

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeModal());

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    if (addAssignmentBtn) addAssignmentBtn.addEventListener('click', addAssignment);

    window.addEventListener('resize', debounce(() => {
        renderCalendar();
    }, 250));
}

// ===== CHARGEMENT DES DONNÉES =====
async function loadData() {
    showLoading();
    try {
        await loadRiders();
        await loadAssignments();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showToast('❌ Erreur de chargement des données');
    } finally {
        hideLoading();
    }
}

async function loadRiders() {
    const resp = await fetch(API_URL + '/riders');
    if (!resp.ok) throw new Error('Erreur réseau cavaliers');
    allRiders = await resp.json();
    colorByName = new Map(allRiders.map(c => [c.name, c.color]));
}

async function loadAssignments() {
    const resp = await fetch(API_URL + '/assignments');
    if (!resp.ok) throw new Error('Erreur réseau assignments');
    allAssignments = await resp.json();
    renderCalendar();
}

// ===== UTILITAIRES =====
function getDateKey(year, month, day) {
    const monthNum = month + 1;
    const monthStr = monthNum < 10 ? '0' + monthNum : '' + monthNum;
    const dayStr = day < 10 ? '0' + day : '' + day;
    return year + '-' + monthStr + '-' + dayStr;
}

function getRiderColor(name) {
    return colorByName.get(name) || '#667eea';
}

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value || '';
    return element.innerHTML;
}

// Types de travail importés depuis workTypes.js
// (les fonctions getWorkTypeIcon et getWorkTypeLabel sont définies dans workTypes.js)

function getDayName(dayIndex) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayIndex];
}

function isMobile() {
    return window.innerWidth <= 600;
}

// ===== RENDU DU CALENDRIER =====
function renderCalendar() {
    console.log('renderCalendar appelé, isMobile:', isMobile());

    if (isMobile()) {
        // Cacher desktop, montrer mobile
        document.getElementById('calendar').style.display = 'none';
        document.getElementById('calendarList').style.display = 'flex';
        renderMobileList();
    } else {
        // Cacher mobile, montrer desktop
        document.getElementById('calendar').style.display = 'grid';
        document.getElementById('calendarList').style.display = 'none';
        renderDesktopCalendar();
    }
}

// ===== RENDU DESKTOP (grille 7 colonnes) =====
function renderDesktopCalendar() {
    console.log('Rendu DESKTOP - Grille');

    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    monthYear.textContent = months[month] + ' ' + year;

    calendar.innerHTML = '';

    // En-têtes des jours
    const headers = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    headers.forEach(dayName => {
        const div = document.createElement('div');
        div.className = 'day-header';
        div.textContent = dayName;
        calendar.appendChild(div);
    });

    // Calcul du premier jour
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Lundi = 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Jours du mois précédent
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = year - 1;
    }
    const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
        createDayElement(prevMonthDays - i, true, prevYear, prevMonth, calendar);
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
        createDayElement(day, false, year, month, calendar);
    }

    // Jours du mois suivant
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
    }

    const totalCells = calendar.children.length - 7; // -7 pour les en-têtes
    const remainingCells = 42 - totalCells - 7;

    for (let day = 1; day <= remainingCells; day++) {
        createDayElement(day, true, nextYear, nextMonth, calendar);
    }
}

function createDayElement(day, isOtherMonth, year, month, container) {
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
        // Display each assignment as one rider/work type/comment unit.
        const dayAssignments = assignments.assignments || [];
        
        if (dayAssignments.length > 0) {
            dayAssignments.forEach((assignment, index) => {
                const badge = document.createElement('div');
                badge.className = 'assignment-badge';
                badge.style.borderLeft = '4px solid ' + getRiderColor(assignment.rider);

                const assignmentText = document.createElement('span');
                assignmentText.textContent = `${assignment.rider} ${getWorkTypeIcon(assignment.work_type)}`;
                assignmentText.title = [assignment.rider, getWorkTypeLabel(assignment.work_type), assignment.comment]
                    .filter(Boolean)
                    .join(' · ');
                badge.appendChild(assignmentText);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.setAttribute('aria-label', `Retirer ${assignment.rider} - ${getWorkTypeLabel(assignment.work_type)}`);
                removeBtn.textContent = '×';
                removeBtn.onclick = function(event) {
                    event.stopPropagation();
                    removeAssignment(dateKey, index);
                };
                badge.appendChild(removeBtn);

                dayDiv.appendChild(badge);
            });
        }

    }

    dayDiv.addEventListener('click', () => {
        if (!isOtherMonth) {
            openModal(day, month, year);
        }
    });

    container.appendChild(dayDiv);
}

// ===== RENDU MOBILE (liste 2 colonnes) =====
function renderMobileList() {
    console.log('Rendu MOBILE - Liste');

    const calendarList = document.getElementById('calendarList');
    const monthYear = document.getElementById('monthYear');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    monthYear.textContent = months[month] + ' ' + year;

    calendarList.innerHTML = '';

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = getDateKey(year, month, day);
        const date = new Date(year, month, day);
        const dayOfWeek = getDayName(date.getDay());
        const assignments = allAssignments[dateKey];

        const row = document.createElement('div');
        row.className = 'list-row';

        // Colonne date
        const dateCol = document.createElement('div');
        dateCol.className = 'list-date';
        dateCol.innerHTML = `
            <div class="list-day-number">${day}</div>
            <div class="list-day-name">${dayOfWeek}</div>
        `;
        row.appendChild(dateCol);

        // Colonne détails
        const detailsCol = document.createElement('div');
        detailsCol.className = 'list-details';

        if (assignments?.assignments?.length > 0) {
            // Assignments
            if (assignments.assignments && assignments.assignments.length > 0) {
                assignments.assignments.forEach(assignment => {
                    const assignmentDiv = document.createElement('div');
                    assignmentDiv.className = 'list-assignment';
                    assignmentDiv.style.borderLeft = '4px solid ' + getRiderColor(assignment.rider);
                    assignmentDiv.innerHTML = `<strong>${escapeHtml(assignment.rider)}</strong> ${getWorkTypeIcon(assignment.work_type)} ${getWorkTypeLabel(assignment.work_type)}`;
                    detailsCol.appendChild(assignmentDiv);

                    if (assignment.comment) {
                        const commentDiv = document.createElement('div');
                        commentDiv.className = 'list-comment';
                        commentDiv.textContent = '💬 ' + assignment.comment;
                        detailsCol.appendChild(commentDiv);
                    }
                });
            }
        } else {
            detailsCol.innerHTML = '<div class="list-empty">Aucune activité</div>';
        }

        row.appendChild(detailsCol);

        row.addEventListener('click', () => {
            openModal(day, month, year);
        });

        calendarList.appendChild(row);
    }
}

// ===== MODAL =====
async function openModal(day, month, year) {
    const modal = document.getElementById('modal');
    const modalDate = document.getElementById('modalDate');

    selectedDate = getDateKey(year, month, day);

    const date = new Date(year, month, day);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    modalDate.textContent = date.toLocaleDateString('fr-FR', options);

    resetAssignmentForm();
    await populateAssignmentRiders();
    displayAssignments();

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTop = 0;
}

async function populateAssignmentRiders() {
    const container = document.getElementById('assignmentRiderButtons');
    if (!container) return;
    container.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/riders/active?date=${selectedDate}`);
        if (!response.ok) throw new Error('Unable to load riders');

        const riders = await response.json();
        riders.forEach(rider => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'assignment-choice rider-choice';
            button.setAttribute('aria-pressed', 'false');
            button.dataset.value = rider.name;
            button.style.setProperty('--rider-color', rider.color || '#667eea');
            button.innerHTML = `<span class="rider-choice-dot" aria-hidden="true"></span><span>${escapeHtml(rider.name)}</span>`;
            button.addEventListener('click', () => selectAssignmentChoice(
                container,
                button,
                'rider'
            ));
            container.appendChild(button);
        });

        if (riders.length === 0) {
            container.innerHTML = '<p class="choice-empty">Aucun cavalier actif pour cette date.</p>';
        }
    } catch (error) {
        console.error('Error loading riders:', error);
        showToast('❌ Erreur de chargement des cavaliers');
    }

}

function selectAssignmentChoice(container, button, choiceType) {
    container.querySelectorAll('.assignment-choice').forEach(choice => {
        const selected = choice === button;
        choice.classList.toggle('selected', selected);
        choice.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    if (choiceType === 'rider') selectedAssignmentRider = button.dataset.value;
    if (choiceType === 'workType') selectedAssignmentWorkType = button.dataset.value;

    const message = document.getElementById('assignmentFormMessage');
    if (message) message.textContent = '';
}

function resetAssignmentForm() {
    const comment = document.getElementById('assignmentComment');
    const message = document.getElementById('assignmentFormMessage');

    selectedAssignmentRider = null;
    selectedAssignmentWorkType = null;
    document.querySelectorAll('.assignment-choice.selected').forEach(button => {
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
    });
    if (comment) comment.value = '';
    if (message) message.textContent = '';
}

async function addAssignment() {
    const commentInput = document.getElementById('assignmentComment');
    const message = document.getElementById('assignmentFormMessage');

    const rider = selectedAssignmentRider;
    const workType = selectedAssignmentWorkType;
    const comment = commentInput?.value.trim() || '';

    if (!rider || !workType) {
        if (message) message.textContent = 'Sélectionnez un cavalier et un type de travail.';
        return;
    }

    showLoading();
    try {
        const response = await fetch(`${API_URL}/assignments/${selectedDate}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rider, work_type: workType, comment })
        });
        const data = await response.json();

        if (!response.ok) {
            if (message) message.textContent = data.error || 'Impossible d’ajouter cette activité.';
            return;
        }

        allAssignments = data.assignments;
        displayAssignments();
        renderCalendar();
        resetAssignmentForm();
        await populateAssignmentRiders();
        showToast('✅ Activité ajoutée');
    } catch (error) {
        console.error('Error adding assignment:', error);
        if (message) message.textContent = 'Erreur de connexion.';
    } finally {
        hideLoading();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

// ===== ASSIGNED TASKS =====
function displayAssignments() {
    const container = document.getElementById('assignedRiders');
    const assignments = allAssignments[selectedDate];

    container.innerHTML = '';

    if (!assignments || !assignments.assignments || assignments.assignments.length === 0) {
        container.innerHTML = `<div class="assignment-empty">
            <span aria-hidden="true">📋</span>
            <strong>Aucune activité</strong>
            <p>Ajoutez la première activité de cette journée.</p>
        </div>`;
        updateAssignedCount(0);
        return;
    }

    assignments.assignments.forEach((assignment, index) => {
        const item = document.createElement('div');
        item.className = 'assignment-card';
        item.style.setProperty('--rider-color', getRiderColor(assignment.rider));

        const assignmentContent = document.createElement('div');
        assignmentContent.className = 'assignment-card-content';
        assignmentContent.innerHTML = `
            <div class="assignment-card-heading">
                <span class="assignment-rider-dot" aria-hidden="true"></span>
                <strong>${escapeHtml(assignment.rider)}</strong>
            </div>
            <div class="assignment-work-type">
                <span aria-hidden="true">${getWorkTypeIcon(assignment.work_type)}</span>
                ${getWorkTypeLabel(assignment.work_type)}
            </div>
            <p class="assignment-comment ${assignment.comment ? '' : 'is-empty'}">
                ${escapeHtml(assignment.comment || 'Aucun commentaire')}
            </p>`;
        item.appendChild(assignmentContent);

        const removeIcon = document.createElement('button');
        removeIcon.className = 'remove-icon';
        removeIcon.type = 'button';
        removeIcon.setAttribute('aria-label', `Retirer ${assignment.rider} - ${getWorkTypeLabel(assignment.work_type)}`);
        removeIcon.textContent = '×';
        removeIcon.onclick = () => removeAssignment(selectedDate, index);
        item.appendChild(removeIcon);

        container.appendChild(item);
    });

    updateAssignedCount(assignments.assignments.length);
}

function updateAssignedCount(count) {
    const countBadge = document.getElementById('assignedCount');
    if (countBadge) countBadge.textContent = count || 0;
    const summary = document.getElementById('assignmentSummary');
    if (summary) {
        summary.textContent = count === 0
            ? 'Aucune activité prévue'
            : `${count} activité${count > 1 ? 's' : ''} prévue${count > 1 ? 's' : ''}`;
    }
}

// ===== REMOVE ASSIGNMENT =====
async function removeAssignment(date, index) {
    showLoading();
    try {
        if (!allAssignments[date] || !Array.isArray(allAssignments[date].assignments)) {
            showToast('⚠️ Aucune activité pour cette date');
            return;
        }

        const dayAssignments = allAssignments[date].assignments;
        if (index < 0 || index >= dayAssignments.length) {
            showToast('⚠️ Index invalide');
            return;
        }

        const response = await fetch(`${API_URL}/assignments/${date}/${index}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            if (selectedDate === date) {
                displayAssignments();
            }
            renderCalendar();
            showToast('✅ Activité retirée');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== UI HELPERS =====
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function showLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'block';
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = 'none';
}

// ===== DEBOUNCE =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== DÉMARRAGE DE L’APPLICATION =====
document.addEventListener('DOMContentLoaded', async () => {
    initializeApp();
    initializeWorkTypeButtons();
    setupEventListeners();
    await loadData();
});

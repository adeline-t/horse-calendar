const API_URL = '/api';
let currentDate = new Date();
let selectedDate = null;
let allAssignments = {};
let allCavaliers = [];
let colorByName = new Map();

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadData();
});

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

    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');
    const saveCommentBtn = document.getElementById('saveCommentBtn');
    const clearCommentBtn = document.getElementById('clearCommentBtn');

    if (commentText && charCount) {
        commentText.addEventListener('input', () => {
            charCount.textContent = commentText.value.length;
        });
    }

    if (saveCommentBtn) saveCommentBtn.addEventListener('click', saveComment);

    if (clearCommentBtn) {
        clearCommentBtn.addEventListener('click', () => {
            if (commentText) commentText.value = '';
            if (charCount) charCount.textContent = '0';
        });
    }

    const workTypeSelect = document.getElementById('workTypeSelect');
    if (workTypeSelect) {
        workTypeSelect.addEventListener('change', saveWorkType);
    }

    window.addEventListener('resize', debounce(() => {
        renderCalendar();
    }, 250));
}

// ===== CHARGEMENT DES DONNÉES =====
async function loadData() {
    showLoading();
    try {
        await loadCavaliers();
        await loadAssignments();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showToast('❌ Erreur de chargement des données');
    } finally {
        hideLoading();
    }
}

async function loadCavaliers() {
    const resp = await fetch(API_URL + '/cavaliers');
    if (!resp.ok) throw new Error('Erreur réseau cavaliers');
    allCavaliers = await resp.json();
    colorByName = new Map(allCavaliers.map(c => [c.name, c.color]));
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

function getCavalierColor(name) {
    return colorByName.get(name) || '#667eea';
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
                badge.style.borderLeft = '4px solid ' + getCavalierColor(cavalier);

                const nameSpan = document.createElement('span');
                nameSpan.textContent = cavalier;
                nameSpan.title = cavalier;
                badge.appendChild(nameSpan);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.setAttribute('aria-label', `Retirer ${cavalier}`);
                removeBtn.textContent = '×';
                removeBtn.onclick = function(event) {
                    event.stopPropagation();
                    removeCavalierFromDay(dateKey, index);
                };
                badge.appendChild(removeBtn);

                dayDiv.appendChild(badge);
            });
        }

        // Commentaire
        if (assignments.comment && assignments.comment.trim() !== '') {
            const commentIndicator = document.createElement('div');
            commentIndicator.className = 'comment-indicator';
            commentIndicator.textContent = '💬';
            commentIndicator.title = 'Commentaire disponible';
            dayDiv.appendChild(commentIndicator);
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

        if (assignments && (assignments.cavaliers?.length > 0 || assignments.work_type || assignments.comment)) {
            // Type de travail
            if (assignments.work_type) {
                const workDiv = document.createElement('div');
                workDiv.className = 'list-work-type';
                workDiv.textContent = getWorkTypeIcon(assignments.work_type) + ' ' + getWorkTypeLabel(assignments.work_type);
                detailsCol.appendChild(workDiv);
            }

            // Cavaliers
            if (assignments.cavaliers && assignments.cavaliers.length > 0) {
                assignments.cavaliers.forEach(cavalier => {
                    const cavalierDiv = document.createElement('div');
                    cavalierDiv.className = 'list-cavalier';
                    cavalierDiv.style.borderLeft = '4px solid ' + getCavalierColor(cavalier);
                    cavalierDiv.textContent = cavalier;
                    detailsCol.appendChild(cavalierDiv);
                });
            }

            // Commentaire
            if (assignments.comment && assignments.comment.trim() !== '') {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'list-comment';
                commentDiv.textContent = '💬 ' + (assignments.comment.length > 30 ? assignments.comment.substring(0, 30) + '...' : assignments.comment);
                detailsCol.appendChild(commentDiv);
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

    const workTypeSelect = document.getElementById('workTypeSelect');
    if (workTypeSelect) {
        workTypeSelect.value = allAssignments[selectedDate]?.work_type || '';
    }

    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');
    if (commentText) {
        const comment = allAssignments[selectedDate]?.comment || '';
        commentText.value = comment;
        if (charCount) charCount.textContent = comment.length;
    }

    displayAssignedCavaliers();
    await loadCavalierButtons();

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTop = 0;
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

// ===== CAVALIERS BUTTONS =====
async function loadCavalierButtons() {
    try {
        const response = await fetch(API_URL + '/cavaliers/active?date=' + selectedDate);
        if (!response.ok) throw new Error('Erreur réseau');

        const cavaliers = await response.json();
        const buttonsDiv = document.getElementById('cavalierButtons');
        buttonsDiv.innerHTML = '';

        if (cavaliers.length === 0) {
            buttonsDiv.innerHTML = '<p class="no-cavaliers-message">Aucun cavalier actif pour cette date</p>';
            return;
        }

        const assignedCavaliers = allAssignments[selectedDate]?.cavaliers || [];

        cavaliers.forEach(cavalier => {
            const isAssigned = assignedCavaliers.includes(cavalier.name);

            const button = document.createElement('button');
            button.className = 'cavalier-btn';
            if (isAssigned) button.classList.add('assigned');

            button.style.borderLeft = '4px solid ' + (cavalier.color || '#667eea');
            button.textContent = cavalier.name;
            button.disabled = isAssigned;
            button.setAttribute('aria-pressed', isAssigned ? 'true' : 'false');

            if (!isAssigned) {
                button.addEventListener('click', () => addCavalierToDay(cavalier.name));
            }

            buttonsDiv.appendChild(button);
        });
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de chargement des cavaliers');
    }
}

// ===== ASSIGNED CAVALIERS =====
function displayAssignedCavaliers() {
    const container = document.getElementById('assignedCavaliers');
    const assignments = allAssignments[selectedDate];

    container.innerHTML = '';

    if (!assignments || !assignments.cavaliers || assignments.cavaliers.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucun cavalier assigné</p>';
        updateAssignedCount(0);
        return;
    }

    assignments.cavaliers.forEach((cavalier, index) => {
        const item = document.createElement('div');
        item.className = 'assigned-cavalier-item';
        item.style.borderLeft = '4px solid ' + getCavalierColor(cavalier);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = cavalier;
        item.appendChild(nameSpan);

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-icon';
        removeIcon.setAttribute('role', 'button');
        removeIcon.setAttribute('aria-label', `Retirer ${cavalier}`);
        removeIcon.textContent = '×';
        removeIcon.onclick = () => removeCavalierFromDay(selectedDate, index);
        item.appendChild(removeIcon);

        container.appendChild(item);
    });

    updateAssignedCount(assignments.cavaliers.length);
}

function updateAssignedCount(count) {
    const countBadge = document.getElementById('assignedCount');
    if (countBadge) countBadge.textContent = count || 0;
}

// ===== AJOUTER CAVALIER =====
async function addCavalierToDay(cavalier) {
    showLoading();
    try {
        let cavaliers = [];
        if (allAssignments[selectedDate] && allAssignments[selectedDate].cavaliers) {
            cavaliers = allAssignments[selectedDate].cavaliers.slice();
        }

        if (cavaliers.includes(cavalier)) {
            showToast('⚠️ Ce cavalier est déjà assigné');
            return;
        }

        cavaliers.push(cavalier);

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: allAssignments[selectedDate]?.comment || '',
                work_type: allAssignments[selectedDate]?.work_type || ''
            })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedCavaliers();
            loadCavalierButtons();
            renderCalendar();
            showToast('✅ Cavalier ajouté');
        } else {
            showToast('❌ Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== SUPPRIMER CAVALIER =====
async function removeCavalierFromDay(date, index) {
    showLoading();
    try {
        if (!allAssignments[date] || !Array.isArray(allAssignments[date].cavaliers)) {
            showToast('⚠️ Aucune assignation pour cette date');
            return;
        }

        const cavaliers = allAssignments[date].cavaliers.slice();
        if (index < 0 || index >= cavaliers.length) {
            showToast('⚠️ Index invalide');
            return;
        }

        cavaliers.splice(index, 1);

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: date,
                cavaliers: cavaliers,
                comment: allAssignments[date]?.comment || '',
                work_type: allAssignments[date]?.work_type || ''
            })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            if (selectedDate === date) {
                displayAssignedCavaliers();
                loadCavalierButtons();
            }
            renderCalendar();
            showToast('✅ Cavalier retiré');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== COMMENTAIRE =====
async function saveComment() {
    showLoading();
    try {
        const comment = document.getElementById('commentText').value.trim();

        const cavaliers = allAssignments[selectedDate]?.cavaliers || [];
        const work_type = allAssignments[selectedDate]?.work_type || '';

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: comment,
                work_type: work_type
            })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            renderCalendar();
            showToast('💾 Commentaire enregistré');
        } else {
            showToast('❌ Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== TYPE DE TRAVAIL =====
async function saveWorkType() {
    showLoading();
    try {
        const workType = document.getElementById('workTypeSelect').value;

        const cavaliers = allAssignments[selectedDate]?.cavaliers || [];
        const comment = allAssignments[selectedDate]?.comment || '';

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                cavaliers: cavaliers,
                comment: comment,
                work_type: workType
            })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            renderCalendar();
            showToast('✅ Type de travail enregistré');
        } else {
            showToast('❌ Erreur lors de la sauvegarde');
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

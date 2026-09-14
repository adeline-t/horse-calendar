const API_URL = '/api';
let currentDate = new Date();
let selectedDate = null;
let allAssignments = {};
let allRiders = [];
let colorByName = new Map();
let selectedRiderForWorkType = null; // Pour tracker le rider en cours de sélection

// ===== INITIALISATION =====
function initializeWorkTypeSelect() {
    const select = document.getElementById('workTypeSelect');
    
    // Ajouter chaque type de travail
    Object.entries(WORK_TYPES).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${value.icon} ${value.label}`;
        select.appendChild(option);
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
        workTypeSelect.addEventListener('change', () => {});  // Désactivé, on va utiliser un nouveau système
    }

    // Custom rider button
    const addCustomRiderBtn = document.getElementById('addCustomRiderBtn');
    if (addCustomRiderBtn) {
        addCustomRiderBtn.addEventListener('click', addCustomRider);
    }

    // Allow Enter key in custom rider input
    const customRiderInput = document.getElementById('customRiderInput');
    if (customRiderInput) {
        customRiderInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCustomRider();
            }
        });
    }

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
        // Afficher les tâches (rider + work_type)
        const tasks = assignments.tasks || [];
        
        if (tasks.length > 0) {
            tasks.forEach((task, index) => {
                const badge = document.createElement('div');
                badge.className = 'task-badge';
                badge.style.borderLeft = '4px solid ' + getRiderColor(task.rider);

                const taskText = document.createElement('span');
                taskText.textContent = `${task.rider} ${getWorkTypeIcon(task.work_type)}`;
                taskText.title = `${task.rider} - ${getWorkTypeLabel(task.work_type)}`;
                badge.appendChild(taskText);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.setAttribute('aria-label', `Retirer ${task.rider} - ${getWorkTypeLabel(task.work_type)}`);
                removeBtn.textContent = '×';
                removeBtn.onclick = function(event) {
                    event.stopPropagation();
                    removeTask(dateKey, index);
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

        if (assignments && (assignments.tasks?.length > 0 || assignments.comment)) {
            // Tâches (rider + work_type)
            if (assignments.tasks && assignments.tasks.length > 0) {
                assignments.tasks.forEach(task => {
                    const taskDiv = document.createElement('div');
                    taskDiv.className = 'list-task';
                    taskDiv.style.borderLeft = '4px solid ' + getRiderColor(task.rider);
                    taskDiv.innerHTML = `<strong>${task.rider}</strong> ${getWorkTypeIcon(task.work_type)} ${getWorkTypeLabel(task.work_type)}`;
                    detailsCol.appendChild(taskDiv);
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

    // Masquer la section "Type de travail" depuis qu'on gère les types par rider
    const workTypeSection = document.querySelector('.work-type-section');
    if (workTypeSection) {
        workTypeSection.style.display = 'none';
    }

    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');
    if (commentText) {
        const comment = allAssignments[selectedDate]?.comment || '';
        commentText.value = comment;
        if (charCount) charCount.textContent = comment.length;
    }

    // Initialiser le sélecteur de type de travail personnalisé
    initializeCustomWorkTypeSelect();
    
    // Réinitialiser les champs personnalisés
    const customRiderInput = document.getElementById('customRiderInput');
    const customWorkTypeSelect = document.getElementById('customWorkTypeSelect');
    const customRiderMessage = document.getElementById('customRiderMessage');
    if (customRiderInput) customRiderInput.value = '';
    if (customWorkTypeSelect) customWorkTypeSelect.value = '';
    if (customRiderMessage) customRiderMessage.textContent = '';

    displayAssignedTasks();
    await loadRiderButtons();

    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTop = 0;
}

function initializeCustomWorkTypeSelect() {
    const select = document.getElementById('customWorkTypeSelect');
    if (!select) return;
    
    // Garder la première option vide
    select.innerHTML = '<option value="">-- Sélectionner le type --</option>';
    
    // Ajouter chaque type de travail
    Object.entries(WORK_TYPES).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${value.icon} ${value.label}`;
        select.appendChild(option);
    });
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

// ===== RIDERS BUTTONS =====
async function loadRiderButtons() {
    try {
        const response = await fetch(API_URL + '/riders/active?date=' + selectedDate);
        if (!response.ok) throw new Error('Erreur réseau');

        const riders = await response.json();
        const buttonsDiv = document.getElementById('riderButtons');
        buttonsDiv.innerHTML = '';

        if (riders.length === 0) {
            buttonsDiv.innerHTML = '<p class="no-riders-message">Aucun cavalier actif pour cette date</p>';
            return;
        }

        const tasks = allAssignments[selectedDate]?.tasks || [];
        
        riders.forEach(rider => {
            // Vérifier si ce rider a déjà toutes les tâches possibles
            const riderTasks = tasks.filter(t => t.rider === rider.name);
            const allWorkTypesAssigned = riderTasks.length > 0;

            const button = document.createElement('button');
            button.className = 'rider-btn';
            if (allWorkTypesAssigned && riderTasks.length >= Object.keys(WORK_TYPES).length) {
                button.classList.add('assigned');
            }

            button.style.borderLeft = '4px solid ' + (rider.color || '#667eea');
            button.textContent = rider.name;
            if (allWorkTypesAssigned && riderTasks.length >= Object.keys(WORK_TYPES).length) {
                button.disabled = true;
            }
            button.setAttribute('aria-pressed', allWorkTypesAssigned ? 'true' : 'false');

            button.addEventListener('click', () => showWorkTypeSelector(rider.name));

            buttonsDiv.appendChild(button);
        });
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de chargement des cavaliers');
    }
}

// ===== ASSIGNED TASKS =====
function displayAssignedTasks() {
    const container = document.getElementById('assignedRiders');
    const assignments = allAssignments[selectedDate];

    container.innerHTML = '';

    if (!assignments || !assignments.tasks || assignments.tasks.length === 0) {
        container.innerHTML = '<p class="empty-message">Aucune tâche assignée</p>';
        updateAssignedCount(0);
        return;
    }

    assignments.tasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'assigned-task-item';
        item.style.borderLeft = '4px solid ' + getRiderColor(task.rider);

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.innerHTML = `<strong>${task.rider}</strong> - ${getWorkTypeIcon(task.work_type)} ${getWorkTypeLabel(task.work_type)}`;
        item.appendChild(taskInfo);

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-icon';
        removeIcon.setAttribute('role', 'button');
        removeIcon.setAttribute('aria-label', `Retirer ${task.rider} - ${getWorkTypeLabel(task.work_type)}`);
        removeIcon.textContent = '×';
        removeIcon.onclick = () => removeTask(selectedDate, index);
        item.appendChild(removeIcon);

        container.appendChild(item);
    });

    updateAssignedCount(assignments.tasks.length);
}

function updateAssignedCount(count) {
    const countBadge = document.getElementById('assignedCount');
    if (countBadge) countBadge.textContent = count || 0;
}

// ===== WORK TYPE SELECTOR =====
function showWorkTypeSelector(riderName) {
    selectedRiderForWorkType = riderName;
    
    const tasks = allAssignments[selectedDate]?.tasks || [];
    const riderWorkTypes = new Set(
        tasks.filter(t => t.rider === riderName).map(t => t.work_type)
    );
    
    const buttonsDiv = document.getElementById('riderButtons');
    const originalContent = buttonsDiv.innerHTML;
    
    buttonsDiv.innerHTML = `<div class="work-type-selector">
        <div class="work-type-selector-header">
            <button class="back-btn" aria-label="Retour">&larr;</button>
            <span class="selector-title">Type de travail pour ${riderName}</span>
        </div>
        <div class="work-type-options" id="workTypeOptions"></div>
    </div>`;
    
    const workTypeOptions = document.getElementById('workTypeOptions');
    Object.entries(WORK_TYPES).forEach(([key, value]) => {
        const isSelected = riderWorkTypes.has(key);
        const option = document.createElement('button');
        option.className = 'work-type-option';
        if (isSelected) option.classList.add('selected');
        
        option.innerHTML = `${value.icon} ${value.label}`;
        option.onclick = () => {
            if (isSelected) {
                removeTaskForRider(riderName, key);
            } else {
                addTaskForRider(riderName, key);
            }
        };
        
        workTypeOptions.appendChild(option);
    });
    
    // Bouton retour
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            buttonsDiv.innerHTML = originalContent;
            loadRiderButtons();
        };
    }
}

async function addTaskForRider(rider, workType) {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/assignments/${selectedDate}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rider: rider,
                work_type: workType
            })
        });

        if (!response.ok) {
            const error = await response.json();
            showToast('❌ ' + (error.error || 'Erreur'));
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedTasks();
            showWorkTypeSelector(rider); // Rafraîchir le sélecteur
            renderCalendar();
            showToast(`✅ ${rider} - ${getWorkTypeLabel(workType)} ajouté`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

async function removeTaskForRider(rider, workType) {
    showLoading();
    try {
        const tasks = allAssignments[selectedDate]?.tasks || [];
        const taskIndex = tasks.findIndex(t => t.rider === rider && t.work_type === workType);
        
        if (taskIndex === -1) {
            showToast('❌ Tâche non trouvée');
            return;
        }
        
        const response = await fetch(`${API_URL}/assignments/${selectedDate}/tasks/${taskIndex}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedTasks();
            if (Object.keys(allAssignments).includes(selectedDate) && 
                allAssignments[selectedDate]?.tasks?.some(t => t.rider === rider)) {
                showWorkTypeSelector(rider); // Rafraîchir le sélecteur
            } else {
                // Revenir à la liste des riders si plus de tâches pour ce rider
                loadRiderButtons();
            }
            renderCalendar();
            showToast(`✅ ${rider} - ${getWorkTypeLabel(workType)} retiré`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== ADD A CUSTOM RIDER =====
async function addCustomRider() {
    const customRiderInput = document.getElementById('customRiderInput');
    const customWorkTypeSelect = document.getElementById('customWorkTypeSelect');
    const customRiderMessage = document.getElementById('customRiderMessage');
    
    if (!customRiderInput || !customWorkTypeSelect) return;
    
    const riderName = customRiderInput.value.trim();
    const workType = customWorkTypeSelect.value;
    
    // Validation
    if (!riderName) {
        if (customRiderMessage) {
                customRiderMessage.textContent = 'Veuillez entrer un nom de cavalier';
            customRiderMessage.className = 'custom-rider-message error';
        }
        return;
    }
    
    if (!workType) {
        if (customRiderMessage) {
            customRiderMessage.textContent = 'Veuillez sélectionner un type de travail';
            customRiderMessage.className = 'custom-rider-message error';
        }
        return;
    }
    
    showLoading();
    try {
        // Vérifier que la tâche n'existe pas déjà
        const tasks = allAssignments[selectedDate]?.tasks || [];
        if (tasks.some(t => t.rider === riderName && t.work_type === workType)) {
            if (customRiderMessage) {
                customRiderMessage.textContent = 'Cette tâche existe déjà';
                customRiderMessage.className = 'custom-rider-message error';
            }
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_URL}/assignments/${selectedDate}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rider: riderName,
                work_type: workType
            })
        });

        if (!response.ok) {
            const error = await response.json();
            if (customRiderMessage) {
                customRiderMessage.textContent = '❌ ' + (error.error || 'Erreur');
                customRiderMessage.className = 'custom-rider-message error';
            }
            hideLoading();
            return;
        }
        
        const data = await response.json();
        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedTasks();
            renderCalendar();
            
            // Feedback utilisateur
            if (customRiderMessage) {
                customRiderMessage.textContent = `✅ ${riderName} - ${getWorkTypeLabel(workType)} ajouté`;
                customRiderMessage.className = 'custom-rider-message success';
            }
            showToast(`✅ ${riderName} - ${getWorkTypeLabel(workType)} ajouté`);
            
            // Réinitialiser les champs
            customRiderInput.value = '';
            customWorkTypeSelect.value = '';
            
            // Garder le focus sur l'input pour ajouter un autre rider
            setTimeout(() => {
                customRiderInput.focus();
            }, 500);
        } else {
            if (customRiderMessage) {
                customRiderMessage.textContent = '❌ Erreur lors de la sauvegarde';
                customRiderMessage.className = 'custom-rider-message error';
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        if (customRiderMessage) {
            customRiderMessage.textContent = '❌ Erreur de connexion';
            customRiderMessage.className = 'custom-rider-message error';
        }
    } finally {
        hideLoading();
    }
}

// ===== AJOUTER TÂCHE (ancienne interface) =====
async function addRiderToDay(rider) {
    showLoading();
    try {
        let tasks = [];
        if (allAssignments[selectedDate] && allAssignments[selectedDate].tasks) {
            tasks = allAssignments[selectedDate].tasks.slice();
        }

        if (tasks.find(t => t.rider === rider)) {
            showToast('⚠️ Ce cavalier est déjà assigné');
            return;
        }

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                tasks: tasks,
                comment: allAssignments[selectedDate]?.comment || ''
            })
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            displayAssignedTasks();
            loadRiderButtons();
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

// ===== SUPPRIMER TÂCHE (nouvelle interface) =====
async function removeTask(date, index) {
    showLoading();
    try {
        if (!allAssignments[date] || !Array.isArray(allAssignments[date].tasks)) {
            showToast('⚠️ Aucune tâche pour cette date');
            return;
        }

        const tasks = allAssignments[date].tasks;
        if (index < 0 || index >= tasks.length) {
            showToast('⚠️ Index invalide');
            return;
        }

        const response = await fetch(`${API_URL}/assignments/${date}/tasks/${index}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            if (selectedDate === date) {
                displayAssignedTasks();
                loadRiderButtons();
            }
            renderCalendar();
            showToast('✅ Tâche retirée');
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

        const tasks = allAssignments[selectedDate]?.tasks || [];

        const response = await fetch(API_URL + '/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                tasks: tasks,
                comment: comment
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
    initializeWorkTypeSelect();
    setupEventListeners();
    await loadData();
});

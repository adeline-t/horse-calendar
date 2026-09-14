const API_URL = '/api';
let currentDate = new Date();
let selectedDate = null;
let allAssignments = {};
let allCavaliers = [];
let colorByName = new Map();
let selectedCavalierForWorkType = null; // Pour tracker le cavalier en cours de sélection

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

    // Custom cavalier button
    const addCustomCavalierBtn = document.getElementById('addCustomCavalierBtn');
    if (addCustomCavalierBtn) {
        addCustomCavalierBtn.addEventListener('click', addCustomCavalier);
    }

    // Allow Enter key in custom cavalier input
    const customCavalierInput = document.getElementById('customCavalierInput');
    if (customCavalierInput) {
        customCavalierInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCustomCavalier();
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
        // Afficher les tâches (cavalier + work_type)
        const tasks = assignments.tasks || [];
        
        if (tasks.length > 0) {
            tasks.forEach((task, index) => {
                const badge = document.createElement('div');
                badge.className = 'task-badge';
                badge.style.borderLeft = '4px solid ' + getCavalierColor(task.cavalier);

                const taskText = document.createElement('span');
                taskText.textContent = `${task.cavalier} ${getWorkTypeIcon(task.work_type)}`;
                taskText.title = `${task.cavalier} - ${getWorkTypeLabel(task.work_type)}`;
                badge.appendChild(taskText);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.setAttribute('aria-label', `Retirer ${task.cavalier} - ${getWorkTypeLabel(task.work_type)}`);
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
            // Tâches (cavalier + work_type)
            if (assignments.tasks && assignments.tasks.length > 0) {
                assignments.tasks.forEach(task => {
                    const taskDiv = document.createElement('div');
                    taskDiv.className = 'list-task';
                    taskDiv.style.borderLeft = '4px solid ' + getCavalierColor(task.cavalier);
                    taskDiv.innerHTML = `<strong>${task.cavalier}</strong> ${getWorkTypeIcon(task.work_type)} ${getWorkTypeLabel(task.work_type)}`;
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

    // Masquer la section "Type de travail" depuis qu'on gère les types par cavalier
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
    const customCavalierInput = document.getElementById('customCavalierInput');
    const customWorkTypeSelect = document.getElementById('customWorkTypeSelect');
    const customCavalierMessage = document.getElementById('customCavalierMessage');
    if (customCavalierInput) customCavalierInput.value = '';
    if (customWorkTypeSelect) customWorkTypeSelect.value = '';
    if (customCavalierMessage) customCavalierMessage.textContent = '';

    displayAssignedTasks();
    await loadCavalierButtons();

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

        const tasks = allAssignments[selectedDate]?.tasks || [];
        
        cavaliers.forEach(cavalier => {
            // Vérifier si ce cavalier a déjà toutes les tâches possibles
            const cavalierTasks = tasks.filter(t => t.cavalier === cavalier.name);
            const allWorkTypesAssigned = cavalierTasks.length > 0;

            const button = document.createElement('button');
            button.className = 'cavalier-btn';
            if (allWorkTypesAssigned && cavalierTasks.length >= Object.keys(WORK_TYPES).length) {
                button.classList.add('assigned');
            }

            button.style.borderLeft = '4px solid ' + (cavalier.color || '#667eea');
            button.textContent = cavalier.name;
            if (allWorkTypesAssigned && cavalierTasks.length >= Object.keys(WORK_TYPES).length) {
                button.disabled = true;
            }
            button.setAttribute('aria-pressed', allWorkTypesAssigned ? 'true' : 'false');

            button.addEventListener('click', () => showWorkTypeSelector(cavalier.name));

            buttonsDiv.appendChild(button);
        });
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de chargement des cavaliers');
    }
}

// ===== ASSIGNED TASKS =====
function displayAssignedTasks() {
    const container = document.getElementById('assignedCavaliers');
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
        item.style.borderLeft = '4px solid ' + getCavalierColor(task.cavalier);

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.innerHTML = `<strong>${task.cavalier}</strong> - ${getWorkTypeIcon(task.work_type)} ${getWorkTypeLabel(task.work_type)}`;
        item.appendChild(taskInfo);

        const removeIcon = document.createElement('span');
        removeIcon.className = 'remove-icon';
        removeIcon.setAttribute('role', 'button');
        removeIcon.setAttribute('aria-label', `Retirer ${task.cavalier} - ${getWorkTypeLabel(task.work_type)}`);
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
function showWorkTypeSelector(cavalierName) {
    selectedCavalierForWorkType = cavalierName;
    
    const tasks = allAssignments[selectedDate]?.tasks || [];
    const cavalierWorkTypes = new Set(
        tasks.filter(t => t.cavalier === cavalierName).map(t => t.work_type)
    );
    
    const buttonsDiv = document.getElementById('cavalierButtons');
    const originalContent = buttonsDiv.innerHTML;
    
    buttonsDiv.innerHTML = `<div class="work-type-selector">
        <div class="work-type-selector-header">
            <button class="back-btn" aria-label="Retour">&larr;</button>
            <span class="selector-title">Type de travail pour ${cavalierName}</span>
        </div>
        <div class="work-type-options" id="workTypeOptions"></div>
    </div>`;
    
    const workTypeOptions = document.getElementById('workTypeOptions');
    Object.entries(WORK_TYPES).forEach(([key, value]) => {
        const isSelected = cavalierWorkTypes.has(key);
        const option = document.createElement('button');
        option.className = 'work-type-option';
        if (isSelected) option.classList.add('selected');
        
        option.innerHTML = `${value.icon} ${value.label}`;
        option.onclick = () => {
            if (isSelected) {
                removeTaskForCavalier(cavalierName, key);
            } else {
                addTaskForCavalier(cavalierName, key);
            }
        };
        
        workTypeOptions.appendChild(option);
    });
    
    // Bouton retour
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            buttonsDiv.innerHTML = originalContent;
            loadCavalierButtons();
        };
    }
}

async function addTaskForCavalier(cavalier, workType) {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/assignments/${selectedDate}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cavalier: cavalier,
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
            showWorkTypeSelector(cavalier); // Rafraîchir le sélecteur
            renderCalendar();
            showToast(`✅ ${cavalier} - ${getWorkTypeLabel(workType)} ajouté`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

async function removeTaskForCavalier(cavalier, workType) {
    showLoading();
    try {
        const tasks = allAssignments[selectedDate]?.tasks || [];
        const taskIndex = tasks.findIndex(t => t.cavalier === cavalier && t.work_type === workType);
        
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
                allAssignments[selectedDate]?.tasks?.some(t => t.cavalier === cavalier)) {
                showWorkTypeSelector(cavalier); // Rafraîchir le sélecteur
            } else {
                // Revenir à la liste des cavaliers si plus de tâches pour ce cavalier
                loadCavalierButtons();
            }
            renderCalendar();
            showToast(`✅ ${cavalier} - ${getWorkTypeLabel(workType)} retiré`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur de connexion');
    } finally {
        hideLoading();
    }
}

// ===== AJOUTER CAVALIER PERSONNALISÉ =====
async function addCustomCavalier() {
    const customCavalierInput = document.getElementById('customCavalierInput');
    const customWorkTypeSelect = document.getElementById('customWorkTypeSelect');
    const customCavalierMessage = document.getElementById('customCavalierMessage');
    
    if (!customCavalierInput || !customWorkTypeSelect) return;
    
    const cavalierName = customCavalierInput.value.trim();
    const workType = customWorkTypeSelect.value;
    
    // Validation
    if (!cavalierName) {
        if (customCavalierMessage) {
            customCavalierMessage.textContent = 'Veuillez entrer un nom de cavalier';
            customCavalierMessage.className = 'custom-cavalier-message error';
        }
        return;
    }
    
    if (!workType) {
        if (customCavalierMessage) {
            customCavalierMessage.textContent = 'Veuillez sélectionner un type de travail';
            customCavalierMessage.className = 'custom-cavalier-message error';
        }
        return;
    }
    
    showLoading();
    try {
        // Vérifier que la tâche n'existe pas déjà
        const tasks = allAssignments[selectedDate]?.tasks || [];
        if (tasks.some(t => t.cavalier === cavalierName && t.work_type === workType)) {
            if (customCavalierMessage) {
                customCavalierMessage.textContent = 'Cette tâche existe déjà';
                customCavalierMessage.className = 'custom-cavalier-message error';
            }
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_URL}/assignments/${selectedDate}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cavalier: cavalierName,
                work_type: workType
            })
        });

        if (!response.ok) {
            const error = await response.json();
            if (customCavalierMessage) {
                customCavalierMessage.textContent = '❌ ' + (error.error || 'Erreur');
                customCavalierMessage.className = 'custom-cavalier-message error';
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
            if (customCavalierMessage) {
                customCavalierMessage.textContent = `✅ ${cavalierName} - ${getWorkTypeLabel(workType)} ajouté`;
                customCavalierMessage.className = 'custom-cavalier-message success';
            }
            showToast(`✅ ${cavalierName} - ${getWorkTypeLabel(workType)} ajouté`);
            
            // Réinitialiser les champs
            customCavalierInput.value = '';
            customWorkTypeSelect.value = '';
            
            // Garder le focus sur l'input pour ajouter un autre cavalier
            setTimeout(() => {
                customCavalierInput.focus();
            }, 500);
        } else {
            if (customCavalierMessage) {
                customCavalierMessage.textContent = '❌ Erreur lors de la sauvegarde';
                customCavalierMessage.className = 'custom-cavalier-message error';
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
        if (customCavalierMessage) {
            customCavalierMessage.textContent = '❌ Erreur de connexion';
            customCavalierMessage.className = 'custom-cavalier-message error';
        }
    } finally {
        hideLoading();
    }
}

// ===== AJOUTER TÂCHE (ancienne interface) =====
async function addCavalierToDay(cavalier) {
    showLoading();
    try {
        let tasks = [];
        if (allAssignments[selectedDate] && allAssignments[selectedDate].tasks) {
            tasks = allAssignments[selectedDate].tasks.slice();
        }

        if (tasks.find(t => t.cavalier === cavalier)) {
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
                loadCavalierButtons();
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


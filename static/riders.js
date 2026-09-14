const API_URL = '/api';
let editingIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    loadRiders();

    document.getElementById('addRiderForm').addEventListener('submit', function(event) {
        event.preventDefault();
        addRider();
    });

    const colorInput = document.getElementById('riderColor');
    colorInput.addEventListener('input', () => {
        document.getElementById('riderColorValue').textContent = colorInput.value;
    });

    // Modal édition
    const editModal = document.getElementById('editModal');
    const closeEditBtn = document.querySelector('.close-edit');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');

    closeEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        editModal.setAttribute('aria-hidden', 'true');
    });

    cancelEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        editModal.setAttribute('aria-hidden', 'true');
    });

    saveEditBtn.addEventListener('click', saveEdit);

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
            editModal.setAttribute('aria-hidden', 'true');
        }
    });
});

async function loadRiders() {
    try {
        const response = await fetch(API_URL + '/riders');
        const riders = await response.json();

        const list = document.getElementById('ridersList');
        const riderCount = document.getElementById('riderCount');
        list.innerHTML = '';
        riderCount.textContent = riders.length;

        if (riders.length === 0) {
            list.innerHTML = `<li class="rider-empty-state">
                <span aria-hidden="true">🐴</span>
                <strong>Aucun cavalier</strong>
                <p>Ajoutez votre premier cavalier avec le formulaire.</p>
            </li>`;
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        riders.forEach((rider, index) => {
            const li = document.createElement('li');
            li.className = 'rider-card';
            li.style.setProperty('--rider-color', rider.color || '#667eea');

            // Info principale
            const mainInfo = document.createElement('div');
            mainInfo.className = 'rider-main-info';

            const info = document.createElement('div');
            info.className = 'rider-info';

            const avatar = document.createElement('span');
            avatar.className = 'rider-avatar';
            avatar.textContent = rider.name.trim().charAt(0).toUpperCase() || '•';

            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'rider-color-indicator';
            colorPicker.value = rider.color || '#667eea';
            colorPicker.title = 'Changer la couleur';
            colorPicker.addEventListener('change', () => updateRiderColor(index, colorPicker.value, li));

            const name = document.createElement('span');
            name.className = 'rider-name';
            name.textContent = rider.name;

            // Statut
            const status = getRiderStatus(rider, today);
            const statusBadge = document.createElement('span');
            statusBadge.className = 'rider-status status-' + status.class;
            statusBadge.textContent = status.text;

            const identity = document.createElement('div');
            identity.className = 'rider-identity';
            identity.appendChild(name);
            identity.appendChild(statusBadge);

            info.appendChild(avatar);
            info.appendChild(identity);
            info.appendChild(colorPicker);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'rider-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Modifier les dates';
            editBtn.addEventListener('click', () => openEditModal(index, rider));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('aria-label', `Supprimer ${rider.name}`);
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => deleteRider(index));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            mainInfo.appendChild(info);
            mainInfo.appendChild(actions);

            // Dates
            const datesDiv = document.createElement('div');
            datesDiv.className = 'rider-dates';

            if (rider.start_date || rider.end_date) {
                if (rider.start_date) {
                    const startItem = document.createElement('div');
                    startItem.className = 'rider-date-item';
                    startItem.innerHTML = '<span>Début</span><strong>' + formatDate(rider.start_date) + '</strong>';
                    datesDiv.appendChild(startItem);
                }

                if (rider.end_date) {
                    const endItem = document.createElement('div');
                    endItem.className = 'rider-date-item';
                    endItem.innerHTML = '<span>Fin</span><strong>' + formatDate(rider.end_date) + '</strong>';
                    datesDiv.appendChild(endItem);
                }
            } else {
                const noDateItem = document.createElement('div');
                noDateItem.className = 'rider-date-item rider-always-active';
                noDateItem.textContent = 'Toujours actif (pas de dates définies)';
                datesDiv.appendChild(noDateItem);
            }

            li.appendChild(mainInfo);
            li.appendChild(datesDiv);
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

function getRiderStatus(rider, today) {
    const startDate = rider.start_date;
    const endDate = rider.end_date;

    if (!startDate && !endDate) {
        return { class: 'active', text: 'Actif' };
    }

    if (endDate && today > endDate) {
        return { class: 'ended', text: 'Terminé' };
    }

    if (startDate && today < startDate) {
        return { class: 'upcoming', text: 'À venir' };
    }

    return { class: 'active', text: 'Actif' };
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function openEditModal(index, rider) {
    editingIndex = index;
    document.getElementById('editRiderName').textContent = rider.name;
    document.getElementById('editStartDate').value = rider.start_date || '';
    document.getElementById('editEndDate').value = rider.end_date || '';
    document.getElementById('editModal').style.display = 'block';
    document.getElementById('editModal').setAttribute('aria-hidden', 'false');
}

async function saveEdit() {
    try {
        const startDate = document.getElementById('editStartDate').value;
        const endDate = document.getElementById('editEndDate').value;

        // Validation
        if (startDate && endDate && startDate > endDate) {
            alert('La date de fin doit être après la date de début');
            return;
        }

        const response = await fetch(API_URL + '/riders/' + editingIndex, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('editModal').style.display = 'none';
            document.getElementById('editModal').setAttribute('aria-hidden', 'true');
            loadRiders();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function addRider() {
    const nameInput = document.getElementById('riderName');
    const colorInput = document.getElementById('riderColor');
    const startDateInput = document.getElementById('riderStartDate');
    const endDateInput = document.getElementById('riderEndDate');

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!name) {
        showRiderFormMessage('Veuillez entrer un nom.', 'error');
        nameInput.focus();
        return;
    }

    // Validation des dates
    if (startDate && endDate && startDate > endDate) {
        showRiderFormMessage('La date de fin doit être après la date de début.', 'error');
        return;
    }

    try {
        const response = await fetch(API_URL + '/riders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                color: color,
                start_date: startDate,
                end_date: endDate
            })
        });

        const data = await response.json();

        if (data.success) {
            nameInput.value = '';
            colorInput.value = '#667eea';
            document.getElementById('riderColorValue').textContent = '#667eea';
            startDateInput.value = '';
            endDateInput.value = '';
            showRiderFormMessage('Cavalier ajouté avec succès.', 'success');
            await loadRiders();
            nameInput.focus();
        } else {
            showRiderFormMessage(data.error || 'Erreur lors de l\'ajout.', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showRiderFormMessage('Erreur de connexion au serveur.', 'error');
    }
}

function showRiderFormMessage(message, type) {
    const container = document.getElementById('riderFormMessage');
    container.textContent = message;
    container.className = `rider-form-message ${type}`;
}

async function deleteRider(index) {
    if (!confirm('Voulez-vous vraiment supprimer ce cavalier ?')) {
        return;
    }

    try {
        const response = await fetch(API_URL + '/riders/' + index, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadRiders();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function updateRiderColor(index, color, riderCard) {
    try {
        const response = await fetch(API_URL + '/riders/' + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: color })
        });

        const data = await response.json();

        if (data.success) {
            riderCard.style.setProperty('--rider-color', color);
        } else {
            alert('Erreur lors de la mise à jour de la couleur');
            loadRiders();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

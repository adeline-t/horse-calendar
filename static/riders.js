const API_URL = '/api';
let editingIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    loadRiders();

    document.getElementById('addRiderBtn').addEventListener('click', addRider);

    document.getElementById('riderName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addRider();
        }
    });

    // Modal édition
    const editModal = document.getElementById('editModal');
    const closeEditBtn = document.querySelector('.close-edit');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');

    closeEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    cancelEditBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    saveEditBtn.addEventListener('click', saveEdit);

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
});

async function loadRiders() {
    try {
        const response = await fetch(API_URL + '/riders');
        const riders = await response.json();

        const list = document.getElementById('ridersList');
        list.innerHTML = '';

        if (riders.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: #999;">Aucun cavalier pour le moment</li>';
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        riders.forEach((rider, index) => {
            const li = document.createElement('li');

            // Info principale
            const mainInfo = document.createElement('div');
            mainInfo.className = 'rider-main-info';

            const info = document.createElement('div');
            info.className = 'rider-info';

            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'rider-color-indicator';
            colorPicker.value = rider.color || '#667eea';
            colorPicker.title = 'Changer la couleur';
            colorPicker.addEventListener('change', () => updateRiderColor(index, colorPicker.value));

            const name = document.createElement('span');
            name.textContent = rider.name;
            name.style.fontWeight = 'bold';

            // Statut
            const status = getRiderStatus(rider, today);
            const statusBadge = document.createElement('span');
            statusBadge.className = 'rider-status status-' + status.class;
            statusBadge.textContent = status.text;

            info.appendChild(colorPicker);
            info.appendChild(name);
            info.appendChild(statusBadge);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'rider-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '📅 Dates';
            editBtn.addEventListener('click', () => openEditModal(index, rider));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Supprimer';
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
                    startItem.innerHTML = '📅 Début: ' + formatDate(rider.start_date);
                    datesDiv.appendChild(startItem);
                }

                if (rider.end_date) {
                    const endItem = document.createElement('div');
                    endItem.className = 'rider-date-item';
                    endItem.innerHTML = '🏁 Fin: ' + formatDate(rider.end_date);
                    datesDiv.appendChild(endItem);
                }
            } else {
                const noDateItem = document.createElement('div');
                noDateItem.style.fontStyle = 'italic';
                noDateItem.style.color = '#999';
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
        alert('Veuillez entrer un nom');
        return;
    }

    // Validation des dates
    if (startDate && endDate && startDate > endDate) {
        alert('La date de fin doit être après la date de début');
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
            startDateInput.value = '';
            endDateInput.value = '';
            loadRiders();
        } else {
            alert(data.error || 'Erreur lors de l\'ajout');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
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

async function updateRiderColor(index, color) {
    try {
        const response = await fetch(API_URL + '/riders/' + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: color })
        });

        const data = await response.json();

        if (!data.success) {
            alert('Erreur lors de la mise à jour de la couleur');
            loadRiders();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

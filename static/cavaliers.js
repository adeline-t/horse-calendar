const API_URL = '/api';
let editingIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCavaliers();

    document.getElementById('addCavalierBtn').addEventListener('click', addCavalier);

    document.getElementById('cavalierName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCavalier();
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

async function loadCavaliers() {
    try {
        const response = await fetch(API_URL + '/cavaliers');
        const cavaliers = await response.json();

        const list = document.getElementById('cavaliersList');
        list.innerHTML = '';

        if (cavaliers.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: #999;">Aucun cavalier pour le moment</li>';
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        cavaliers.forEach((cavalier, index) => {
            const li = document.createElement('li');

            // Info principale
            const mainInfo = document.createElement('div');
            mainInfo.className = 'cavalier-main-info';

            const info = document.createElement('div');
            info.className = 'cavalier-info';

            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'cavalier-color-indicator';
            colorPicker.value = cavalier.color || '#667eea';
            colorPicker.title = 'Changer la couleur';
            colorPicker.addEventListener('change', () => updateCavalierColor(index, colorPicker.value));

            const name = document.createElement('span');
            name.textContent = cavalier.name;
            name.style.fontWeight = 'bold';

            // Statut
            const status = getCavalierStatus(cavalier, today);
            const statusBadge = document.createElement('span');
            statusBadge.className = 'cavalier-status status-' + status.class;
            statusBadge.textContent = status.text;

            info.appendChild(colorPicker);
            info.appendChild(name);
            info.appendChild(statusBadge);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'cavalier-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '📅 Dates';
            editBtn.addEventListener('click', () => openEditModal(index, cavalier));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Supprimer';
            deleteBtn.addEventListener('click', () => deleteCavalier(index));

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            mainInfo.appendChild(info);
            mainInfo.appendChild(actions);

            // Dates
            const datesDiv = document.createElement('div');
            datesDiv.className = 'cavalier-dates';

            if (cavalier.start_date || cavalier.end_date) {
                if (cavalier.start_date) {
                    const startItem = document.createElement('div');
                    startItem.className = 'cavalier-date-item';
                    startItem.innerHTML = '📅 Début: ' + formatDate(cavalier.start_date);
                    datesDiv.appendChild(startItem);
                }

                if (cavalier.end_date) {
                    const endItem = document.createElement('div');
                    endItem.className = 'cavalier-date-item';
                    endItem.innerHTML = '🏁 Fin: ' + formatDate(cavalier.end_date);
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

function getCavalierStatus(cavalier, today) {
    const startDate = cavalier.start_date;
    const endDate = cavalier.end_date;

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

function openEditModal(index, cavalier) {
    editingIndex = index;
    document.getElementById('editCavalierName').textContent = cavalier.name;
    document.getElementById('editStartDate').value = cavalier.start_date || '';
    document.getElementById('editEndDate').value = cavalier.end_date || '';
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

        const response = await fetch(API_URL + '/cavaliers/' + editingIndex, {
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
            loadCavaliers();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function addCavalier() {
    const nameInput = document.getElementById('cavalierName');
    const colorInput = document.getElementById('cavalierColor');
    const startDateInput = document.getElementById('cavalierStartDate');
    const endDateInput = document.getElementById('cavalierEndDate');

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
        const response = await fetch(API_URL + '/cavaliers', {
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
            loadCavaliers();
        } else {
            alert(data.error || 'Erreur lors de l\'ajout');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function deleteCavalier(index) {
    if (!confirm('Voulez-vous vraiment supprimer ce cavalier ?')) {
        return;
    }

    try {
        const response = await fetch(API_URL + '/cavaliers/' + index, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            loadCavaliers();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function updateCavalierColor(index, color) {
    try {
        const response = await fetch(API_URL + '/cavaliers/' + index, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ color: color })
        });

        const data = await response.json();

        if (!data.success) {
            alert('Erreur lors de la mise à jour de la couleur');
            loadCavaliers();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

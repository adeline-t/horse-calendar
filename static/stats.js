const API_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    loadStats();

    document.getElementById('filterBtn').addEventListener('click', () => {
        loadStats();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('monthFilter').value = '';
        document.getElementById('yearFilter').value = '';
        loadStats();
    });
});

function initializeFilters() {
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = String(index + 1).padStart(2, '0');
        option.textContent = month;
        monthFilter.appendChild(option);
    });

    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    }

    // Sélectionner le mois et l'année actuels par défaut
    const now = new Date();
    monthFilter.value = String(now.getMonth() + 1).padStart(2, '0');
    yearFilter.value = now.getFullYear();
}

async function loadStats() {
    try {
        const month = document.getElementById('monthFilter').value;
        const year = document.getElementById('yearFilter').value;

        let url = API_URL + '/stats';
        const params = [];
        if (month) params.push('month=' + month);
        if (year) params.push('year=' + year);
        if (params.length > 0) url += '?' + params.join('&');

        const response = await fetch(url);
        if (!response.ok) throw new Error('Unable to load statistics');
        const data = await response.json();

        displayRiderStats(data.rider_day_counts, data.riders_data);
        displayWorkTypeStats(data.work_type_counts);
        displaySelectedPeriod(month, year);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
}

function displayRiderStats(stats, ridersData) {
    const container = document.getElementById('riderStats');
    container.innerHTML = '';

    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<div class="no-stats">Aucun jour planifié pour cette période.</div>';
        return;
    }

    // Sort by descending number of distinct assignment days.
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const maximum = sorted[0][1];

    sorted.forEach(([rider, count]) => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.style.setProperty('--stat-progress', `${(count / maximum) * 100}%`);

        const left = document.createElement('div');
        left.className = 'stat-item-left';

        const riderData = ridersData.find(c => c.name === rider);
        const color = riderData ? riderData.color : '#667eea';

        const colorDiv = document.createElement('span');
        colorDiv.className = 'stat-color';
        colorDiv.style.backgroundColor = color;

        const name = document.createElement('span');
        name.className = 'stat-name';
        name.textContent = rider;

        left.appendChild(colorDiv);
        left.appendChild(name);

        const countDiv = document.createElement('div');
        countDiv.className = 'stat-count';
        countDiv.innerHTML = `<strong>${count}</strong><span>jour${count > 1 ? 's' : ''}</span>`;

        item.appendChild(left);
        item.appendChild(countDiv);
        container.appendChild(item);
    });
}

function displayWorkTypeStats(stats) {
    const container = document.getElementById('workTypeStats');
    container.innerHTML = '';

    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<div class="no-stats">Aucune activité enregistrée pour cette période.</div>';
        return;
    }

    // Sort by descending activity count.
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const maximum = sorted[0][1];

    sorted.forEach(([workType, count]) => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.style.setProperty('--stat-progress', `${(count / maximum) * 100}%`);

        const left = document.createElement('div');
        left.className = 'stat-item-left';

        const icon = document.createElement('span');
        icon.className = 'stat-work-icon';
        icon.textContent = getWorkTypeIcon(workType);

        const name = document.createElement('span');
        name.className = 'stat-name';
        name.textContent = getWorkTypeLabel(workType);

        left.appendChild(icon);
        left.appendChild(name);

        const countDiv = document.createElement('div');
        countDiv.className = 'stat-count';
        countDiv.innerHTML = `<strong>${count}</strong><span>activité${count > 1 ? 's' : ''}</span>`;

        item.appendChild(left);
        item.appendChild(countDiv);
        container.appendChild(item);
    });
}

function displaySelectedPeriod(month, year) {
    const container = document.getElementById('statsPeriod');
    const monthSelect = document.getElementById('monthFilter');

    if (month && year) {
        const monthLabel = monthSelect.options[monthSelect.selectedIndex].text;
        container.textContent = `${monthLabel} ${year}`;
    } else if (year) {
        container.textContent = `Année ${year}`;
    } else {
        container.textContent = 'Toutes les périodes';
    }
}

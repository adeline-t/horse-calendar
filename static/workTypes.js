/**
 * Configuration centralisée des types de travail
 * Maintient une source unique de vérité pour les iconiques et labels
 */

const WORK_TYPES = {
    longe:   { icon: '🔄', label: 'Longe' },
    liberte: { icon: '🐎', label: 'Liberté' },
    repos:   { icon: '💤', label: 'Repos' },
    plat:    { icon: '🎩', label: 'Dressage' },
    cso:     { icon: '🚧', label: 'CSO' },
    balade:  { icon: '🌲', label: 'Balade' },
    tap:     { icon: '👣', label: 'TAP' },
    autre: {
        icon: '❓',
        label: 'Autre'
    }
};

function getWorkTypeIcon(workType) {
    return WORK_TYPES[workType]?.icon || '';
}

function getWorkTypeLabel(workType) {
    return WORK_TYPES[workType]?.label || workType;
}
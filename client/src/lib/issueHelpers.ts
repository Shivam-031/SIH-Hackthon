export const STATUS_LABELS: Record<string, string> = {
  pending:      'Pending',
  'under-review': 'Under Review',
  verified:     'Verified',
  assigned:     'Assigned',
  'work-started': 'Work Started',
  completed:    'Completed',
  closed:       'Closed',
  rejected:     'Rejected',
  // legacy
  'in-progress': 'In Progress',
  acknowledged: 'Acknowledged',
  resolved:     'Resolved',
};

export const STATUS_COLOR: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  'under-review': 'bg-blue-100 text-blue-800 border-blue-200',
  verified:       'bg-purple-100 text-purple-800 border-purple-200',
  assigned:       'bg-indigo-100 text-indigo-800 border-indigo-200',
  'work-started': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  completed:      'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed:         'bg-slate-100 text-slate-700 border-slate-200',
  rejected:       'bg-red-100 text-red-800 border-red-200',
  // legacy
  'in-progress':  'bg-blue-100 text-blue-800 border-blue-200',
  acknowledged:   'bg-sky-100 text-sky-800 border-sky-200',
  resolved:       'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const MAP_STATUS_COLOR: Record<string, string> = {
  pending:        '#f59e0b',
  'under-review': '#6366f1',
  verified:       '#8b5cf6',
  assigned:       '#3b82f6',
  'work-started': '#06b6d4',
  completed:      '#10b981',
  closed:         '#6b7280',
  rejected:       '#ef4444',
  'in-progress':  '#3b82f6',
  acknowledged:   '#0ea5e9',
  resolved:       '#10b981',
};

export const SEVERITY_COLOR: Record<string, string> = {
  low:      'bg-green-100 text-green-800',
  medium:   'bg-yellow-100 text-yellow-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const CATEGORY_LABELS: Record<string, string> = {
  'road-damage':    'Road Damage',
  garbage:          'Garbage',
  'water-leakage':  'Water Leakage',
  electricity:      'Electricity',
  'street-light':   'Street Light',
  'illegal-parking':'Illegal Parking',
  pothole:          'Pothole',
  'tree-fallen':    'Tree Fallen',
  pollution:        'Pollution',
  'animal-issue':   'Animal Issue',
  'public-safety':  'Public Safety',
  other:            'Other',
  // legacy
  streetlight:      'Street Light',
  'water-leak':     'Water Leakage',
  'road-damage':    'Road Damage',
  'traffic-signal': 'Traffic Signal',
  drainage:         'Drainage',
};

export const CATEGORY_EMOJI: Record<string, string> = {
  'road-damage':    '🛣️',
  garbage:          '🗑️',
  'water-leakage':  '💧',
  electricity:      '⚡',
  'street-light':   '💡',
  'illegal-parking':'🚗',
  pothole:          '🕳️',
  'tree-fallen':    '🌳',
  pollution:        '🌫️',
  'animal-issue':   '🐾',
  'public-safety':  '🛡️',
  other:            '📋',
  streetlight:      '💡',
  'water-leak':     '💧',
  'traffic-signal': '🚦',
  drainage:         '🌊',
};

export const getCoordinates = (loc: {
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
}): [number, number] | null => {
  if (loc.coordinates && loc.coordinates.length === 2) {
    return [loc.coordinates[1], loc.coordinates[0]]; // [lat, lng] for Leaflet
  }
  if (loc.latitude && loc.longitude) {
    return [loc.latitude, loc.longitude];
  }
  return null;
};

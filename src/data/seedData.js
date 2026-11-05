import { generateDefectSvg } from '../utils/imageAnalysis';

export const categoryMeta = {
  'Road damage': {
    iconName: 'AlertTriangle',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
    department: 'Public works',
    slaHours: 24
  },
  'Street lighting': {
    iconName: 'Zap',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    department: 'Street lighting',
    slaHours: 12
  },
  'Waste management': {
    iconName: 'Trash2',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
    department: 'Sanitation',
    slaHours: 8
  },
  'Public space': {
    iconName: 'Trees',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    department: 'Parks & recreation',
    slaHours: 48
  }
};

export const citySectors = [
  { id: 'all', name: 'All Sectors (Entire City)', x: 50, y: 50, zoom: 1 },
  { id: 'sector-1', name: 'Sector 1 • North Hills Residential', x: 25, y: 25, zoom: 2 },
  { id: 'sector-2', name: 'Sector 2 • Downtown Civic Core', x: 45, y: 45, zoom: 2.2 },
  { id: 'sector-3', name: 'Sector 3 • Harbor Pier & Tech Corridor', x: 70, y: 65, zoom: 2.1 },
  { id: 'sector-4', name: 'Sector 4 • Waterfront Promenade', x: 80, y: 35, zoom: 2.4 }
];

export const liveResponseCrews = [
  {
    id: 'CREW-14',
    name: 'DOT Rapid Patch #14',
    type: 'Heavy Road Repair',
    status: 'En Route to CIV-1048',
    crewSize: 4,
    x: 36,
    y: 48,
    lat: 40.7135,
    lng: -74.0048,
    vehicle: 'Thermal Asphalt Compactor Truck',
    color: '#3B82F6'
  },
  {
    id: 'CREW-09',
    name: 'Sanitation Unit S-09',
    type: 'Commercial Waste Clearance',
    status: 'On Scene at Market Square',
    crewSize: 2,
    x: 58,
    y: 65,
    lat: 40.722,
    lng: -73.996,
    vehicle: 'High-Volume Compactor Van',
    color: '#F59E0B'
  },
  {
    id: 'CREW-02',
    name: 'Bureau Electrical Unit B',
    type: 'Power & Streetlight Maintenance',
    status: 'Patrolling Sector 1',
    crewSize: 3,
    x: 64,
    y: 33,
    lat: 40.729,
    lng: -73.988,
    vehicle: 'Bucket Lift Truck #4',
    color: '#10B981'
  },
  {
    id: 'DRONE-01',
    name: 'GIS Autonomous Drone Alpha',
    type: 'Aerial Telemetry & Thermal Scan',
    status: 'Active Aerial Sweep',
    crewSize: 0,
    x: 48,
    y: 38,
    lat: 40.718,
    lng: -74.001,
    vehicle: 'Hexacopter LIDAR Unit',
    color: '#00F2FE'
  }
];

export const smartWasteBins = [
  {
    id: 'BIN-101',
    code: 'WB-DT-401',
    name: 'Market Square Solar Compactor',
    type: 'General Waste',
    place: 'Market Square Central Plaza',
    x: 54,
    y: 66,
    lat: 40.7214,
    lng: -73.9982,
    fillLevel: 94,
    capacityKg: 80,
    currentKg: 75.2,
    temperatureC: 22,
    batteryPercent: 91,
    status: 'Overflow Critical',
    lastEmptied: '18 hrs ago',
    rfid: 'RFID-9942-A'
  },
  {
    id: 'BIN-102',
    code: 'WB-NH-112',
    name: 'North Hills E-Waste & Recycler',
    type: 'Recyclables',
    place: 'Oak Lane & 14th Blvd',
    x: 67,
    y: 33,
    lat: 40.7306,
    lng: -73.9866,
    fillLevel: 78,
    capacityKg: 60,
    currentKg: 46.8,
    temperatureC: 20,
    batteryPercent: 88,
    status: 'Collection Scheduled',
    lastEmptied: '6 hrs ago',
    rfid: 'RFID-3310-B'
  },
  {
    id: 'BIN-103',
    code: 'WB-HB-208',
    name: 'Harbor Tech Pier Organic Station',
    type: 'Organic Compost',
    place: 'Pier 7 Innovation Walk',
    x: 72,
    y: 62,
    lat: 40.7185,
    lng: -73.9912,
    fillLevel: 42,
    capacityKg: 50,
    currentKg: 21.0,
    temperatureC: 24,
    batteryPercent: 95,
    status: 'Optimal',
    lastEmptied: '2 hrs ago',
    rfid: 'RFID-5521-C'
  },
  {
    id: 'BIN-104',
    code: 'WB-WF-305',
    name: 'Riverside Promenade Solar Bin',
    type: 'Plastics & Bottles',
    place: 'Riverside Park Pier 4',
    x: 81,
    y: 54,
    lat: 40.7051,
    lng: -74.015,
    fillLevel: 89,
    capacityKg: 70,
    currentKg: 62.3,
    temperatureC: 21,
    batteryPercent: 84,
    status: 'High Fill Alert',
    lastEmptied: '14 hrs ago',
    rfid: 'RFID-7718-D'
  },
  {
    id: 'BIN-105',
    code: 'WB-CV-109',
    name: 'Civic Center Hazardous Vault',
    type: 'E-Waste',
    place: 'City Hall Annex West',
    x: 35,
    y: 42,
    lat: 40.7138,
    lng: -74.0055,
    fillLevel: 28,
    capacityKg: 40,
    currentKg: 11.2,
    temperatureC: 19,
    batteryPercent: 98,
    status: 'Optimal',
    lastEmptied: '1 day ago',
    rfid: 'RFID-1102-E'
  }
];

export const initialIssues = [
  {
    id: 'CIV-1048',
    type: 'Road damage',
    title: 'Severe Asphalt Cavity on 5th Ave',
    place: '5th Ave & Pine Street, Downtown',
    time: '14 min ago',
    status: 'In progress',
    priority: 'Urgent',
    department: 'Public works',
    assignedCrew: 'DOT Rapid Patch #14',
    tone: 'blue',
    x: 32,
    y: 44,
    lat: 40.7128,
    lng: -74.006,
    confidence: 98,
    description: 'Deep pothole (~14cm depth) causing severe rim strikes and vehicle swerving into adjacent bike lane.',
    image: generateDefectSvg('Road damage'),
    hasAfter: true,
    afterImage: generateDefectSvg('Road damage-fixed'),
    analysis: {
      score: 96,
      changeRatio: 42,
      isRepaired: true,
      findings: [
        'Photometric alignment: 99.4% pixel congruence',
        'Asphalt void sealed with DOT-grade hot mix patch',
        'GPS verification confirmed within 1.8 meters',
        'Certified ready for municipal engineer sign-off'
      ]
    },
    upvotes: 38,
    reporter: 'Jordan Davis',
    adaAffected: true,
    schoolZone: false,
    auditTrail: [
      { time: '14 min ago', event: 'Report filed with photo evidence by Jordan Davis' },
      { time: '11 min ago', event: 'AI vision auto-triaged severity: Urgent (Class 4 Void)' },
      { time: '8 min ago', event: 'Dispatched to DOT Rapid Patch #14' },
      { time: '4 min ago', event: 'Crew on scene, thermal asphalt compaction in progress' }
    ]
  },
  {
    id: 'CIV-1047',
    type: 'Street lighting',
    title: 'Pedestrian Luminaire Failure',
    place: 'Oak Lane & 14th Blvd, North District',
    time: '32 min ago',
    status: 'Verified',
    priority: 'High',
    department: 'Street lighting',
    assignedCrew: 'Bureau Electrical Unit B',
    tone: 'green',
    x: 68,
    y: 31,
    lat: 40.7306,
    lng: -73.9866,
    confidence: 94,
    description: 'Twin pedestrian sodium-vapor lamps flickering and completely cutting out after dusk, causing blind spot near school crosswalk.',
    image: generateDefectSvg('Street lighting'),
    hasAfter: true,
    afterImage: generateDefectSvg('Street lighting-fixed'),
    analysis: {
      score: 93,
      changeRatio: 58,
      isRepaired: true,
      findings: [
        'High-efficiency LED luminaire head installed',
        'Full 4,500 lumens lux output restored',
        'Telemetry circuit ping successful'
      ]
    },
    upvotes: 19,
    reporter: 'Marcus Reed',
    adaAffected: false,
    schoolZone: true,
    auditTrail: [
      { time: '32 min ago', event: 'Report filed by Marcus Reed' },
      { time: '20 min ago', event: 'Verified by City Operations Desk' },
      { time: '15 min ago', event: 'Assigned to Electrical Unit B (SLA: 12h)' }
    ]
  },
  {
    id: 'CIV-1046',
    type: 'Waste management',
    title: 'Market Square Receptacle Overflow',
    place: 'Market Square Central Plaza',
    time: '1 hr ago',
    status: 'Assigned',
    priority: 'Normal',
    department: 'Sanitation',
    assignedCrew: 'Sanitation Truck S-09',
    tone: 'amber',
    x: 55,
    y: 68,
    lat: 40.7214,
    lng: -73.9982,
    confidence: 91,
    description: 'Three high-volume commercial trash receptacles overflowing onto the pedestrian plaza following morning market rush.',
    image: generateDefectSvg('Waste management'),
    hasAfter: true,
    afterImage: generateDefectSvg('Waste management-fixed'),
    analysis: {
      score: 95,
      changeRatio: 64,
      isRepaired: true,
      findings: [
        'Receptacles cleared, washed and liner replaced',
        'Sidewalk power-washed per municipal hygiene protocol',
        'Tamper seal verified'
      ]
    },
    upvotes: 24,
    reporter: 'Sara Lin',
    adaAffected: true,
    schoolZone: false,
    auditTrail: [
      { time: '1 hr ago', event: 'Report filed by Sara Lin' },
      { time: '45 min ago', event: 'Sanitation triage verified high-traffic zone' },
      { time: '30 min ago', event: 'Route S-09 detour initiated' }
    ]
  },
  {
    id: 'CIV-1045',
    type: 'Public space',
    title: 'Damaged Riverside Promenade Bench',
    place: 'Riverside Waterfront Park, Pier 4',
    time: '2 hrs ago',
    status: 'Resolved',
    priority: 'Normal',
    department: 'Parks & recreation',
    assignedCrew: 'Parks Carpentry Crew 3',
    tone: 'violet',
    x: 82,
    y: 58,
    lat: 40.7051,
    lng: -74.015,
    confidence: 89,
    description: 'Splintered middle teak slat poses snag risk to joggers and elderly visitors.',
    image: generateDefectSvg('Public space'),
    hasAfter: true,
    afterImage: generateDefectSvg('Public space-fixed'),
    analysis: {
      score: 97,
      changeRatio: 51,
      isRepaired: true,
      findings: [
        'Weather-treated certified teak planks installed',
        'Structural load capacity tested to 350kg',
        'Full photographic before/after match verified'
      ]
    },
    upvotes: 14,
    reporter: 'Jordan Davis',
    adaAffected: false,
    schoolZone: false,
    auditTrail: [
      { time: '2 hrs ago', event: 'Report filed by Jordan Davis' },
      { time: '1 hr ago', event: 'Parks team dispatched' },
      { time: '25 min ago', event: 'Repair finalized with photographic proof' },
      { time: '10 min ago', event: 'Admin approved and closed ticket' }
    ]
  }
];

export const sampleReportPresets = [
  {
    name: 'Asphalt Pothole on Broadway',
    category: 'Road damage',
    title: 'Deep crater in crosswalk on Broadway',
    place: 'Broadway & 8th Street',
    description: 'Car tire impact hazard directly in the pedestrian crosswalk zone. Vehicle alignment damage reported.',
    priority: 'Urgent',
    department: 'Public works',
    imageType: 'Road damage',
    adaAffected: true,
    schoolZone: false
  },
  {
    name: 'Extinguished Highway High-Mast Lamp',
    category: 'Street lighting',
    title: 'High-mast light out at Expressway off-ramp',
    place: 'Westside Expressway Exit 4',
    description: 'Merge ramp is completely dark after 7:00 PM. High crash incidence zone.',
    priority: 'High',
    department: 'Street lighting',
    imageType: 'Street lighting',
    adaAffected: false,
    schoolZone: false
  },
  {
    name: 'Alleyway Bulk Waste Dumping',
    category: 'Waste management',
    title: 'Commercial cardboard & pallet spill',
    place: 'Mercer Street Service Alley',
    description: 'Heavy blockage preventing ambulance and fire access in commercial corridor.',
    priority: 'High',
    department: 'Sanitation',
    imageType: 'Waste management',
    adaAffected: false,
    schoolZone: false
  },
  {
    name: 'Vandalized Playground Safety Gate',
    category: 'Public space',
    title: 'Children playground latch loose & detached',
    place: 'Central Meadow Children Zone',
    description: 'Safety gate swings directly onto high-speed bicycle path.',
    priority: 'Urgent',
    department: 'Parks & recreation',
    imageType: 'Public space',
    adaAffected: false,
    schoolZone: true
  }
];

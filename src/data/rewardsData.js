export const citizenTiers = [
  { name: 'Bronze Citizen', minPoints: 0, maxPoints: 100, icon: 'Shield', color: '#CD7F32' },
  { name: 'Silver Scout', minPoints: 100, maxPoints: 300, icon: 'Award', color: '#94A3B8' },
  { name: 'Gold Champion', minPoints: 300, maxPoints: 600, icon: 'Sparkles', color: '#F59E0B' },
  { name: 'City Guardian', minPoints: 600, maxPoints: 9999, icon: 'Zap', color: '#00F2FE' }
];

export const badgesList = [
  { id: 'first_rep', title: 'First Responder', desc: 'Submitted your first verified civic issue', icon: 'AlertTriangle', pointsReq: 10 },
  { id: 'photo_eye', title: 'Precision Lens', desc: 'Uploaded 3+ high-confidence photos with GPS locked', icon: 'Camera', pointsReq: 50 },
  { id: 'fix_tracker', title: 'Neighborhood Watch', desc: 'Helped 5 issues reach fully resolved status', icon: 'CheckCircle', pointsReq: 120 },
  { id: 'community_voice', title: 'Civic Pillar', desc: 'Accumulated over 250 verified karma points', icon: 'Award', pointsReq: 250 },
  { id: 'urban_steward', title: 'Metro Hero', desc: 'Ranked in the top 5% of monthly city contributors', icon: 'Shield', pointsReq: 500 }
];

export const perksCatalog = [
  {
    id: 'perk-transit',
    title: 'Metro Rapid Transit 24H Pass',
    category: 'Public Mobility',
    cost: 80,
    desc: 'Unlimited rides on city subways and electric buses for 24 hours.',
    code: 'METRO-GO-8492',
    icon: 'Zap'
  },
  {
    id: 'perk-tree',
    title: 'Urban Forestry Tree Dedication',
    category: 'Sustainability',
    cost: 150,
    desc: 'A native sapling planted in your neighborhood with digital certificate.',
    code: 'TREE-GROW-5510',
    icon: 'Trees'
  },
  {
    id: 'perk-museum',
    title: 'City Center Museum & Art Pass',
    category: 'Culture',
    cost: 120,
    desc: 'Free admission for two to the Metropolitan History & Modern Arts Center.',
    code: 'CULTURE-MET-3391',
    icon: 'Building2'
  },
  {
    id: 'perk-parking',
    title: 'Municipal EV Charging Voucher',
    category: 'Green City',
    cost: 100,
    desc: '2 hours of complimentary high-speed charging at any public station.',
    code: 'EV-CHARGE-9014',
    icon: 'Zap'
  }
];

export const cityLeaderboard = [
  { rank: 1, name: 'Jordan Davis (You)', district: 'District 4 - Westside', reports: 18, points: 420, badge: 'Gold Champion', avatar: 'JD' },
  { rank: 2, name: 'Maya Chen', district: 'District 2 - Midtown', reports: 15, points: 385, badge: 'Gold Champion', avatar: 'MC' },
  { rank: 3, name: 'Alejandro Gomez', district: 'District 7 - Northside', reports: 12, points: 310, badge: 'Gold Champion', avatar: 'AG' },
  { rank: 4, name: 'Aisha Al-Mansoor', district: 'District 1 - Waterfront', reports: 9, points: 240, badge: 'Silver Scout', avatar: 'AA' },
  { rank: 5, name: 'Liam O’Connor', district: 'District 5 - South Gate', reports: 8, points: 195, badge: 'Silver Scout', avatar: 'LO' }
];

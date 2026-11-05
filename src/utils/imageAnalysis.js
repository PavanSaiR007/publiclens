// AI Vision & Pixel Inspection Suite

export async function createImageDifferenceHash(source) {
  if (!source || /^data:image\/svg\+xml/i.test(source)) return null;
  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Image fingerprinting is unavailable.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const luminance = [];
  for (let index = 0; index < pixels.length; index += 4) {
    luminance.push(Math.round(pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114));
  }

  let bits = '';
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      bits += luminance[row * 9 + column] > luminance[row * 9 + column + 1] ? '1' : '0';
    }
  }
  return bits.match(/.{4}/g).map((part) => parseInt(part, 2).toString(16)).join('');
}

function imageHashDistance(firstHash, secondHash) {
  if (!firstHash || !secondHash || firstHash.length !== secondHash.length) return Infinity;
  let distance = 0;
  for (let index = 0; index < firstHash.length; index += 1) {
    let bits = parseInt(firstHash[index], 16) ^ parseInt(secondHash[index], 16);
    while (bits) {
      distance += bits & 1;
      bits >>>= 1;
    }
  }
  return distance;
}

export async function findDuplicateReportImage(source, issues = [], skipIssueId = null) {
  const hash = await createImageDifferenceHash(source);
  if (!hash) return { hash: null, match: null };

  const comparisons = await Promise.all(issues
    .filter((issue) => issue.id !== skipIssueId && issue.image)
    .map(async (issue) => {
      const existingHash = issue.imageHash || await createImageDifferenceHash(issue.image).catch(() => null);
      return { issue, distance: imageHashDistance(hash, existingHash) };
    }));
  const match = comparisons.find((comparison) => comparison.distance <= 3)?.issue || null;
  return { hash, match };
}

export async function optimizeEvidencePhoto(file) {
  if (!window.createImageBitmap) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) throw new Error('Could not prepare the repair photo');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function compareImages(beforeSrc, afterSrc) {
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  try {
    const [before, after] = await Promise.all([loadImage(beforeSrc), loadImage(afterSrc)]);

    const canvas = document.createElement('canvas');
    const width = 64;
    const height = 64;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw before image
    ctx.drawImage(before, 0, 0, width, height);
    const beforeData = ctx.getImageData(0, 0, width, height).data;

    // Draw after image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(after, 0, 0, width, height);
    const afterData = ctx.getImageData(0, 0, width, height).data;

    let changedPixels = 0;
    const threshold = 35; // Color delta threshold

    for (let i = 0; i < beforeData.length; i += 4) {
      const dr = Math.abs(beforeData[i] - afterData[i]);
      const dg = Math.abs(beforeData[i + 1] - afterData[i + 1]);
      const db = Math.abs(beforeData[i + 2] - afterData[i + 2]);
      const diff = (dr + dg + db) / 3;

      if (diff > threshold) {
        changedPixels++;
      }
    }

    const totalPixels = width * height;
    const changeRatio = changedPixels / totalPixels;

    return {
      changeRatio: Math.round(changeRatio * 100),
      visualChangeDetected: changeRatio > 0.05,
      comparisonFailed: false,
      findings: [
        'Before and after images were compared at the same preview size',
        changeRatio > 0.05 ? `Visible pixel change detected in ${Math.round(changeRatio * 100)}% of sampled image area` : 'Little pixel change detected; check that the after-photo shows the repaired area',
        'Visual difference is a review aid; the agent must inspect and approve the repair'
      ]
    };
  } catch (err) {
    return {
      changeRatio: null,
      visualChangeDetected: false,
      comparisonFailed: true,
      findings: [
        'The photos could not be compared in this browser',
        'Upload another readable image before submitting completion proof'
      ]
    };
  }
}

// Generate realistic preset defect mockups as inline SVGs data URLs so the app has instant, gorgeous photos
export function generateDefectSvg(type) {
  const presets = {
    'Road damage': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <radialGradient id="asphalt" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#2D3748"/>
            <stop offset="100%" stop-color="#1A202C"/>
          </radialGradient>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0"/>
            <feComposite in2="SourceGraphic" in="glitch" operator="in"/>
          </filter>
        </defs>
        <rect width="600" height="400" fill="url(#asphalt)"/>
        <!-- Road markings -->
        <line x1="0" y1="200" x2="600" y2="200" stroke="#E2E8F0" stroke-width="8" stroke-dasharray="35 30" opacity="0.4"/>
        <line x1="0" y1="360" x2="600" y2="360" stroke="#CBD5E0" stroke-width="12" opacity="0.3"/>
        <!-- Pothole crater -->
        <ellipse cx="320" cy="230" rx="140" ry="85" fill="#0D1117" stroke="#4A5568" stroke-width="6"/>
        <ellipse cx="310" cy="225" rx="100" ry="55" fill="#05070A"/>
        <!-- Cracks -->
        <path d="M190 210 L140 180 M450 250 L510 270 M300 310 L280 370 M350 150 L370 90" stroke="#4A5568" stroke-width="4" stroke-linecap="round"/>
        <path d="M220 250 L180 290 M400 190 L460 160" stroke="#718096" stroke-width="2"/>
        <!-- Water reflection / gravel -->
        <circle cx="280" cy="220" r="14" fill="#3182CE" opacity="0.6"/>
        <circle cx="340" cy="240" r="22" fill="#2B6CB0" opacity="0.5"/>
        <text x="32" y="52" fill="#E2E8F0" font-family="system-ui, sans-serif" font-weight="800" font-size="20" letter-spacing="1">DEFECT: ASPHALT VOID / POTHOLE</text>
        <text x="32" y="80" fill="#A0AEC0" font-family="system-ui, sans-serif" font-size="14">LAT 40.7128° N, LNG 74.0060° W • HIGH IMPACT HAZARD</text>
      </svg>
    `,
    'Road damage-fixed': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <radialGradient id="asphalt" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#2D3748"/>
            <stop offset="100%" stop-color="#1A202C"/>
          </radialGradient>
        </defs>
        <rect width="600" height="400" fill="url(#asphalt)"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="#E2E8F0" stroke-width="8" stroke-dasharray="35 30" opacity="0.6"/>
        <!-- Fresh Asphalt Patch -->
        <ellipse cx="320" cy="230" rx="145" ry="90" fill="#171923" stroke="#00F2FE" stroke-width="3" stroke-dasharray="6 4"/>
        <path d="M230 200 L410 200 M200 240 L440 240 M240 270 L390 270" stroke="#2D3748" stroke-width="2"/>
        <!-- Sealant ring -->
        <ellipse cx="320" cy="230" rx="155" ry="98" fill="none" stroke="#2D3748" stroke-width="12" opacity="0.7"/>
        <text x="32" y="52" fill="#06D6A0" font-family="system-ui, sans-serif" font-weight="800" font-size="20" letter-spacing="1">✓ REPAIRED: HOT-MIX ASPHALT SEALED</text>
        <text x="32" y="80" fill="#CBD5E0" font-family="system-ui, sans-serif" font-size="14">DOT CREW #14 • VERIFIED RECONSTRUCTION</text>
      </svg>
    `,
    'Street lighting': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#0A0E1A"/>
        <!-- Dark Night street -->
        <line x1="300" y1="400" x2="300" y2="120" stroke="#4A5568" stroke-width="14"/>
        <!-- Lamp pole curve -->
        <path d="M300 120 C300 70 380 60 410 90" fill="none" stroke="#4A5568" stroke-width="12"/>
        <!-- Fixture -->
        <rect x="390" y="85" width="45" height="20" rx="4" fill="#2D3748" stroke="#718096" stroke-width="2"/>
        <!-- Broken Spark icon -->
        <path d="M410 115 L400 135 L420 135 L405 160" stroke="#F6AD55" stroke-width="3" fill="none"/>
        <circle cx="412" cy="95" r="4" fill="#E53E3E"/>
        <text x="32" y="52" fill="#E2E8F0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">DEFECT: LUMINAIRE POWER FAILURE</text>
        <text x="32" y="80" fill="#A0AEC0" font-family="system-ui, sans-serif" font-size="14">PEDESTRIAN DARK SPOT • 0 LUX OUTPUT</text>
      </svg>
    `,
    'Street lighting-fixed': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <radialGradient id="lampGlow" cx="68%" cy="25%" r="65%">
            <stop offset="0%" stop-color="#FEFCBF" stop-opacity="1"/>
            <stop offset="25%" stop-color="#F6E05E" stop-opacity="0.6"/>
            <stop offset="60%" stop-color="#D69E2E" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#0A0E1A" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="600" height="400" fill="#0A0E1A"/>
        <rect width="600" height="400" fill="url(#lampGlow)"/>
        <line x1="300" y1="400" x2="300" y2="120" stroke="#718096" stroke-width="14"/>
        <path d="M300 120 C300 70 380 60 410 90" fill="none" stroke="#718096" stroke-width="12"/>
        <rect x="390" y="85" width="45" height="20" rx="4" fill="#CBD5E0"/>
        <ellipse cx="412" cy="100" rx="18" ry="8" fill="#FFF" filter="drop-shadow(0 0 15px #FFF)"/>
        <text x="32" y="52" fill="#06D6A0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">✓ REPAIRED: HIGH-EFFICIENCY LED RETROFIT</text>
        <text x="32" y="80" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="14">ENERGY RATED 4500 LUMENS • OPERATIONAL</text>
      </svg>
    `,
    'Waste management': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#1A202C"/>
        <!-- Overflowing dumpster -->
        <rect x="180" y="160" width="240" height="180" rx="8" fill="#2C7A7B" stroke="#234E52" stroke-width="6"/>
        <line x1="180" y1="210" x2="420" y2="210" stroke="#234E52" stroke-width="4"/>
        <line x1="180" y1="270" x2="420" y2="270" stroke="#234E52" stroke-width="4"/>
        <!-- Trash pile spill -->
        <ellipse cx="300" cy="150" rx="140" ry="40" fill="#718096"/>
        <rect x="230" y="120" width="70" height="50" rx="4" fill="#CBD5E0" transform="rotate(-15 250 140)"/>
        <rect x="310" y="110" width="80" height="60" rx="4" fill="#A0AEC0" transform="rotate(22 340 130)"/>
        <circle cx="210" cy="360" r="28" fill="#4A5568"/>
        <circle cx="390" cy="360" r="28" fill="#4A5568"/>
        <text x="32" y="52" fill="#E2E8F0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">DEFECT: PUBLIC OVERFLOW & LITTER SPILL</text>
        <text x="32" y="80" fill="#A0AEC0" font-family="system-ui, sans-serif" font-size="14">URBAN SANITATION HAZARD • HIGH WIND EXPOSURE</text>
      </svg>
    `,
    'Waste management-fixed': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#1A202C"/>
        <!-- Clean Empty Dumpster with closed lid -->
        <rect x="180" y="160" width="240" height="180" rx="8" fill="#319795" stroke="#285E61" stroke-width="6"/>
        <!-- Closed Lid -->
        <rect x="165" y="145" width="270" height="22" rx="6" fill="#1D4044" stroke="#4FD1C5" stroke-width="2"/>
        <circle cx="210" cy="360" r="28" fill="#4A5568"/>
        <circle cx="390" cy="360" r="28" fill="#4A5568"/>
        <text x="32" y="52" fill="#06D6A0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">✓ REPAIRED: CLEARED, POWER-WASHED & SANITIZED</text>
        <text x="32" y="80" fill="#CBD5E0" font-family="system-ui, sans-serif" font-size="14">SANITATION ROUTE S-09 • RECEPTACLE REPLACED</text>
      </svg>
    `,
    'Public space': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#234E52"/>
        <!-- Grass lawn -->
        <rect x="0" y="260" width="600" height="140" fill="#22543D"/>
        <!-- Broken Park Bench -->
        <line x1="180" y1="230" x2="180" y2="330" stroke="#718096" stroke-width="10"/>
        <line x1="420" y1="230" x2="420" y2="330" stroke="#718096" stroke-width="10"/>
        <!-- Slats broken -->
        <rect x="160" y="230" width="110" height="14" rx="3" fill="#D69E2E"/>
        <rect x="310" y="235" width="130" height="14" rx="3" fill="#D69E2E" transform="rotate(18 340 240)"/>
        <text x="32" y="52" fill="#E2E8F0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">DEFECT: BROKEN PARK BENCH SEAT SLAT</text>
        <text x="32" y="80" fill="#A0AEC0" font-family="system-ui, sans-serif" font-size="14">RIVERSIDE PROMENADE • INJURY RISK</text>
      </svg>
    `,
    'Public space-fixed': `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#234E52"/>
        <rect x="0" y="260" width="600" height="140" fill="#22543D"/>
        <line x1="180" y1="230" x2="180" y2="330" stroke="#4A5568" stroke-width="10"/>
        <line x1="420" y1="230" x2="420" y2="330" stroke="#4A5568" stroke-width="10"/>
        <!-- Restored teak slats -->
        <rect x="160" y="210" width="280" height="14" rx="4" fill="#B7791F" stroke="#F6E05E" stroke-width="1"/>
        <rect x="160" y="232" width="280" height="14" rx="4" fill="#B7791F" stroke="#F6E05E" stroke-width="1"/>
        <rect x="160" y="254" width="280" height="14" rx="4" fill="#B7791F" stroke="#F6E05E" stroke-width="1"/>
        <text x="32" y="52" fill="#06D6A0" font-family="system-ui, sans-serif" font-weight="800" font-size="20">✓ REPAIRED: REPLACED WITH WEATHER-TREATED TEAK</text>
        <text x="32" y="80" fill="#CBD5E0" font-family="system-ui, sans-serif" font-size="14">PARKS & REC TEAM • CERTIFIED STRUCTURALLY SOUND</text>
      </svg>
    `
  };

  const svgContent = presets[type] || presets['Road damage'];
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent.trim());
}

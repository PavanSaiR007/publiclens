import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

// Global metropolitan telemetry nodes
const GLOBAL_CITIES = [
  { name: 'New York (Metro Hub)', lat: 40.7128, lng: -74.006, color: '#6EE7B7', reports: 482 },
  { name: 'London (Command Ward)', lat: 51.5074, lng: -0.1278, color: '#34D399', reports: 319 },
  { name: 'Tokyo (IoT Grid Alpha)', lat: 35.6762, lng: 139.6503, color: '#A7F3D0', reports: 614 },
  { name: 'Mumbai (Central Dispatch)', lat: 19.076, lng: 72.8777, color: '#A3E635', reports: 541 },
  { name: 'Paris (Eco Infrastructure)', lat: 48.8566, lng: 2.3522, color: '#86EFAC', reports: 228 },
  { name: 'Singapore (Smart Island)', lat: 1.3521, lng: 103.8198, color: '#10B981', reports: 195 },
  { name: 'Sydney (Coastal Sensor)', lat: -33.8688, lng: 151.2093, color: '#5EEAD4', reports: 172 },
  { name: 'Dubai (Desert Smart Grid)', lat: 25.2048, lng: 55.2708, color: '#BEF264', reports: 290 },
  { name: 'San Francisco (Bay Fleet)', lat: 37.7749, lng: -122.4194, color: '#10B981', reports: 367 }
];

// Convert Lat/Lng to 3D Cartesian coordinates on a sphere
function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural 4K Earth Texture Canvas Generator
function createProceduralEarthTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep ocean night backdrop
  ctx.fillStyle = '#071711';
  ctx.fillRect(0, 0, width, height);

  // Subtle longitude & latitude cyber grid
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.075)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw procedural stylized landmasses with neon borders
  ctx.fillStyle = '#123729';
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.42)';
  ctx.lineWidth = 2;

  // Approximate continents
  const landmasses = [
    // North America
    [[350, 150], [550, 160], [620, 240], [560, 360], [450, 420], [350, 360], [260, 260], [280, 180]],
    // South America
    [[450, 450], [560, 480], [600, 580], [540, 750], [460, 850], [420, 720], [410, 540]],
    // Europe
    [[950, 200], [1100, 180], [1160, 240], [1120, 320], [1020, 340], [940, 280]],
    // Africa
    [[960, 360], [1140, 360], [1200, 480], [1160, 680], [1080, 780], [980, 640], [930, 450]],
    // Asia
    [[1180, 160], [1500, 180], [1650, 280], [1580, 450], [1400, 480], [1280, 400], [1200, 280]],
    // Australia
    [[1500, 600], [1680, 620], [1720, 750], [1580, 800], [1480, 720]]
  ];

  landmasses.forEach((poly) => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Glowing city night lights clusters
  const lights = [
    [480, 280, 14], [430, 320, 10], [520, 350, 8], // US East/West
    [1020, 260, 16], [1080, 280, 12], // Europe
    [1350, 420, 15], [1450, 380, 12], [1580, 340, 18], // India, China, Japan
    [1600, 720, 10], [1060, 720, 8] // Australia, S. Africa
  ];

  lights.forEach(([lx, ly, radius]) => {
    const radGlow = ctx.createRadialGradient(lx, ly, 1, lx, ly, radius * 2.5);
    radGlow.addColorStop(0, 'rgba(167, 243, 208, 1)');
    radGlow.addColorStop(0.3, 'rgba(16, 185, 129, 0.82)');
    radGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.arc(lx, ly, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 3D City Telemetry Pin
function CityBeacon({ city, radius = 2.5, onHover }) {
  const pos = useMemo(() => latLngToVector3(city.lat, city.lng, radius), [city, radius]);
  const normal = useMemo(() => pos.clone().normalize(), [pos]);
  const beamEnd = useMemo(() => pos.clone().add(normal.clone().multiplyScalar(0.4)), [pos, normal]);
  const beaconRef = useRef();

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4 + city.lat) * 0.25);
    }
  });

  return (
    <group
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover && onHover(city);
      }}
      onPointerOut={() => onHover && onHover(null)}
    >
      {/* Surface Beacon Dot */}
      <mesh ref={beaconRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={city.color} />
      </mesh>

      {/* Vertical Light Laser Beam */}
      <mesh position={[normal.x * 0.2, normal.y * 0.2, normal.z * 0.2]}>
        <cylinderGeometry args={[0.008, 0.015, 0.4, 8]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.85} />
      </mesh>

      {/* Pulsing Base Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 24]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Orbiting Satellite with Data Trail
function OrbitingSatellite({ orbitRadius = 3.2, speed = 0.5, color = '#6EE7B7' }) {
  const satRef = useRef();

  useFrame((state) => {
    if (satRef.current) {
      const t = state.clock.elapsedTime * speed;
      satRef.current.position.x = Math.cos(t) * orbitRadius;
      satRef.current.position.z = Math.sin(t) * orbitRadius;
      satRef.current.position.y = Math.sin(t * 1.5) * 0.8;
      satRef.current.rotation.y = t * 2;
    }
  });

  return (
    <group ref={satRef}>
      {/* Satellite Body */}
      <mesh>
        <boxGeometry args={[0.08, 0.06, 0.06]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Solar Arrays */}
      <mesh position={[0.1, 0, 0]}>
        <boxGeometry args={[0.12, 0.005, 0.05]} />
          <meshBasicMaterial color="#86EFAC" />
      </mesh>
      <mesh position={[-0.1, 0, 0]}>
        <boxGeometry args={[0.12, 0.005, 0.05]} />
          <meshBasicMaterial color="#86EFAC" />
      </mesh>
      <pointLight color={color} intensity={1.5} distance={1.5} />
    </group>
  );
}

// Connecting Arc between 2 cities
function CityArc({ cityA, cityB, radius = 2.5, color = '#6EE7B7' }) {
  const curve = useMemo(() => {
    const v1 = latLngToVector3(cityA.lat, cityA.lng, radius);
    const v2 = latLngToVector3(cityB.lat, cityB.lng, radius);
    const mid = v1.clone().lerp(v2, 0.5).normalize().multiplyScalar(radius * 1.25);
    return new THREE.QuadraticBezierCurve3(v1, mid, v2);
  }, [cityA, cityB, radius]);

  const points = useMemo(() => curve.getPoints(40), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.45} linewidth={1.5} />
    </line>
  );
}

// Main 3D Globe Mesh Component
function EarthGlobe({ onHoverCity }) {
  const globeRef = useRef();
  const cloudsRef = useRef();
  const atmosphereRef = useRef();
  const earthTexture = useMemo(() => createProceduralEarthTexture(), []);

  // Smooth continuous rotation
  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group>
      {/* Ambient Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 4, 5]} intensity={2.2} color="#FFFFFF" />
      <directionalLight position={[-6, -4, -5]} intensity={0.55} color="#34D399" />

      {/* Rotating Globe Core */}
      <group ref={globeRef}>
        {/* Main Earth Sphere with 4K Procedural Texture */}
        <mesh>
          <sphereGeometry args={[2.5, 64, 64]} />
          <meshStandardMaterial
            map={earthTexture}
            metalness={0.4}
            roughness={0.7}
            emissive="#10B981"
            emissiveIntensity={0.045}
          />
        </mesh>

        {/* Outer Cloud / Wireframe Hex Grid Layer */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[2.53, 36, 36]} />
          <meshBasicMaterial
            color="#6EE7B7"
            wireframe
            transparent
            opacity={0.09}
          />
        </mesh>

        {/* Global Cities */}
        {GLOBAL_CITIES.map((city) => (
          <CityBeacon key={city.name} city={city} radius={2.5} onHover={onHoverCity} />
        ))}

        {/* Telemetry Data Arcs */}
        <CityArc cityA={GLOBAL_CITIES[0]} cityB={GLOBAL_CITIES[1]} radius={2.5} color="#6EE7B7" />
        <CityArc cityA={GLOBAL_CITIES[1]} cityB={GLOBAL_CITIES[4]} radius={2.5} color="#86EFAC" />
        <CityArc cityA={GLOBAL_CITIES[1]} cityB={GLOBAL_CITIES[3]} radius={2.5} color="#A3E635" />
        <CityArc cityA={GLOBAL_CITIES[3]} cityB={GLOBAL_CITIES[5]} radius={2.5} color="#10B981" />
        <CityArc cityA={GLOBAL_CITIES[5]} cityB={GLOBAL_CITIES[2]} radius={2.5} color="#6EE7B7" />
        <CityArc cityA={GLOBAL_CITIES[2]} cityB={GLOBAL_CITIES[8]} radius={2.5} color="#34D399" />
        <CityArc cityA={GLOBAL_CITIES[8]} cityB={GLOBAL_CITIES[0]} radius={2.5} color="#10B981" />
        <CityArc cityA={GLOBAL_CITIES[5]} cityB={GLOBAL_CITIES[6]} radius={2.5} color="#5EEAD4" />
      </group>

      {/* Atmospheric Glowing Rim Aura (Fresnel Effect) */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.68, 64, 64]} />
        <meshBasicMaterial
          color="#34D399"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Equatorial Orbital Ring Track */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.2, 0.008, 16, 100]} />
        <meshBasicMaterial color="#6EE7B7" transparent opacity={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 4, 0, Math.PI / 6]}>
        <torusGeometry args={[3.45, 0.008, 16, 100]} />
        <meshBasicMaterial color="#86EFAC" transparent opacity={0.24} />
      </mesh>

      {/* Orbiting Surveillance Satellites */}
      <OrbitingSatellite orbitRadius={3.2} speed={0.4} color="#6EE7B7" />
      <OrbitingSatellite orbitRadius={3.45} speed={-0.3} color="#A3E635" />
    </group>
  );
}

// Exportable 3D Globe Canvas with Controls
export default function Globe3D({ onHoverCity }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 6.2], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      className="w-full h-full"
    >
      <Stars radius={120} depth={60} count={3500} factor={4} saturation={0.5} fade speed={1} />
      <EarthGlobe onHoverCity={onHoverCity} />
      <OrbitControls
        enableZoom={true}
        minDistance={3.8}
        maxDistance={9.0}
        enablePan={false}
        autoRotate={false}
        rotateSpeed={0.6}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { liveResponseCrews, citySectors } from '../data/seedData';
import { sound } from '../utils/audio';

// 3D Building block with customizable aesthetic
function Building({ position, size, color = '#1E293B', glow = false, wireframe = false }) {
  const meshRef = useRef();

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={wireframe ? 0.9 : 0.25}
        metalness={0.7}
        wireframe={wireframe}
        emissive={glow ? '#00F2FE' : '#0B132B'}
        emissiveIntensity={glow ? 0.4 : 0.05}
      />
    </mesh>
  );
}

// Moving light pulse along roads
function TrafficPulse({ start, end, speed = 1, color = '#00F2FE' }) {
  const ref = useRef();
  const [t, setT] = useState(Math.random());

  useFrame((_, delta) => {
    setT((prev) => (prev + delta * 0.4 * speed) % 1);
    if (ref.current) {
      ref.current.position.lerpVectors(start, end, t);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// 3D Patrol Truck with Flashing Emergency Beacon
function PatrolVehicle3D({ crew, onSelect }) {
  const ref = useRef();
  const beaconRef = useRef();

  const posX = (crew.x - 50) / 10;
  const posZ = (crew.y - 50) / 10;

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.8;
    }
  });

  return (
    <group
      position={[posX, 0.15, posZ]}
      onClick={(e) => {
        e.stopPropagation();
        sound.playClick();
        onSelect && onSelect(crew);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Truck Chassis */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color={crew.color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Flashing Light Bar */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.06, 0.08]} />
        <meshBasicMaterial color="#FF3366" />
      </mesh>
      <pointLight ref={beaconRef} position={[0, 0.35, 0]} color="#FF3366" distance={3} intensity={1.5} />

      {/* Crew Label */}
      <Text
        position={[0, 0.55, 0]}
        fontSize={0.16}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {crew.id}
      </Text>
    </group>
  );
}

// 3D Aerial Drone Hovering with Laser Scanner
function Drone3D() {
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 2.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      ref.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={ref} position={[-0.2, 2.4, -1.2]}>
      {/* Drone body */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 6]} />
        <meshStandardMaterial color="#00F2FE" emissive="#00F2FE" emissiveIntensity={0.5} />
      </mesh>
      {/* Downward scanning beam */}
      <mesh position={[0, -1.2, 0]}>
        <coneGeometry args={[0.8, 2.4, 16, 1, true]} />
        <meshBasicMaterial color="#00F2FE" transparent opacity={0.12} wireframe side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 0.35, 0]} fontSize={0.14} color="#00F2FE">
        GIS DRONE ALPHA
      </Text>
    </group>
  );
}

// 3D Hologram Pin for an Issue
function IssueBeacon({ issue, isSelected, onSelect }) {
  const ringRef = useRef();

  const posX = (issue.x - 50) / 10;
  const posZ = (issue.y - 50) / 10;
  const posY = 1.2;

  const colorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    amber: '#F59E0B',
    violet: '#8B5CF6'
  };
  const color = colorMap[issue.tone] || '#3B82F6';

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
      ringRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      ringRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <group position={[posX, posY, posZ]}>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            sound.playClick();
            onSelect(issue);
          }}
          style={{ cursor: 'pointer' }}
        >
          {/* Main Diamond Marker */}
          <mesh position={[0, 0.4, 0]} rotation={[0.7, 0.7, 0]}>
            <octahedronGeometry args={[isSelected ? 0.38 : 0.26]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={isSelected ? 1.6 : 0.8}
              roughness={0.1}
            />
          </mesh>

          {/* Light Beacon Beam downward */}
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.08, 0.8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.65} />
          </mesh>

          {/* Issue ID label billboard */}
          <Text
            position={[0, 0.9, 0]}
            fontSize={0.22}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#0B132B"
          >
            {issue.id}
          </Text>
        </group>
      </Float>

      {/* Pulsing ground radar ring */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.48, 24]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.95 : 0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// City Environment Grid
function CityEnvironment({ themeMode }) {
  const isWireframe = themeMode === 'blueprint';
  const groundColor = themeMode === 'cyberpunk' ? '#0F051D' : isWireframe ? '#040C1A' : '#0B1220';
  const gridColor = themeMode === 'cyberpunk' ? '#FF007F' : isWireframe ? '#00F2FE' : '#38BDF8';

  const buildings = useMemo(() => {
    const list = [];
    const gridSize = 7;
    const spacing = 1.35;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (Math.abs(i) === 0 || Math.abs(j) === 0 || Math.abs(i) === 4 || Math.abs(j) === 4) continue;
        if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;

        const height = 0.5 + Math.abs(Math.sin(i * 1.7 + j * 2.3)) * 2.2;
        const width = 0.8 + Math.sin(i * 3) * 0.15;
        const depth = 0.8 + Math.cos(j * 3) * 0.15;
        const isTechHub = Math.abs(i) === 3 && Math.abs(j) === 2;

        let bColor = '#141E33';
        if (themeMode === 'cyberpunk') bColor = isTechHub ? '#3B0764' : '#180B2B';
        if (themeMode === 'blueprint') bColor = '#061830';

        list.push({
          id: `${i}-${j}`,
          position: [i * spacing, height / 2, j * spacing],
          size: [width, height, depth],
          color: bColor,
          glow: isTechHub,
          wireframe: isWireframe
        });
      }
    }
    return list;
  }, [themeMode, isWireframe]);

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color={groundColor} roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Grid road lines */}
      <gridHelper args={[24, 24, gridColor, '#1E293B']} position={[0, 0.02, 0]} />

      {/* Buildings */}
      {buildings.map((b) => (
        <Building key={b.id} {...b} />
      ))}

      {/* Central Civic Center Plaza Tower */}
      <Building
        position={[0, 1.8, 0]}
        size={[1.6, 3.6, 1.6]}
        color={themeMode === 'cyberpunk' ? '#4C1D95' : '#1E293B'}
        glow
        wireframe={isWireframe}
      />

      {/* Traffic Pulses */}
      <TrafficPulse start={new THREE.Vector3(-9, 0.08, 0)} end={new THREE.Vector3(9, 0.08, 0)} speed={1.4} color={gridColor} />
      <TrafficPulse start={new THREE.Vector3(0, 0.08, -9)} end={new THREE.Vector3(0, 0.08, 9)} speed={1.2} color="#10B981" />
      <TrafficPulse start={new THREE.Vector3(9, 0.08, 5.4)} end={new THREE.Vector3(-9, 0.08, 5.4)} speed={0.9} color="#F59E0B" />
      <TrafficPulse start={new THREE.Vector3(-5.4, 0.08, 9)} end={new THREE.Vector3(-5.4, 0.08, -9)} speed={1.1} color="#00F2FE" />
    </group>
  );
}

export default function CityMap3D({
  issues,
  selected,
  onSelect,
  onPinDrop = null,
  isPinDropActive = false
}) {
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'blueprint' | 'cyberpunk'
  const [selectedCrew, setSelectedCrew] = useState(null);

  const handleGroundClick = (e) => {
    if (!isPinDropActive || !onPinDrop) return;
    const pt = e.point;
    // Map -10 to 10 back to 0-100 x/y
    const x = Math.round(50 + pt.x * 10);
    const y = Math.round(50 + pt.z * 10);
    const lat = 40.7128 + (50 - y) * 0.0008;
    const lng = -74.006 + (x - 50) * 0.0006;
    sound.playSuccess();
    onPinDrop({ x, y, lat, lng });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080E1A' }}>
      <Canvas
        camera={{ position: [8, 9, 8], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%', cursor: isPinDropActive ? 'crosshair' : 'grab' }}
        onPointerDown={handleGroundClick}
      >
        <color attach="background" args={[mapTheme === 'cyberpunk' ? '#090314' : '#080E1A']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[12, 18, 8]} intensity={1.2} castShadow />
        <pointLight position={[0, 4, 0]} intensity={1.5} color={mapTheme === 'cyberpunk' ? '#FF007F' : '#00F2FE'} distance={15} />

        {/* 3D City Architecture */}
        <CityEnvironment themeMode={mapTheme} />

        {/* Live Response Trucks on patrol */}
        {liveResponseCrews.map((crew) => (
          <PatrolVehicle3D key={crew.id} crew={crew} onSelect={(c) => setSelectedCrew(c)} />
        ))}

        {/* Autonomous GIS Drone */}
        <Drone3D />

        {/* Floating 3D Issue Beacons */}
        {issues.map((issue) => (
          <IssueBeacon
            key={issue.id}
            issue={issue}
            isSelected={selected?.id === issue.id}
            onSelect={onSelect}
          />
        ))}

        <OrbitControls
          enableRotate
          enablePan
          enableZoom
          maxPolarAngle={Math.PI / 2.15}
          minDistance={4}
          maxDistance={24}
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Top Left Theme Selector */}
      <div className="map-theme-bar">
        <span className="theme-label">3D Environment:</span>
        {['dark', 'blueprint', 'cyberpunk'].map((t) => (
          <button
            key={t}
            className={`map-theme-btn ${mapTheme === t ? 'active' : ''}`}
            onClick={() => {
              sound.playClick();
              setMapTheme(t);
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Selected Response Unit Card */}
      {selectedCrew && (
        <div className="crew-popup-card">
          <div className="crew-popup-header">
            <span className="crew-type">{selectedCrew.type}</span>
            <button onClick={() => setSelectedCrew(null)}>×</button>
          </div>
          <b>{selectedCrew.name}</b>
          <p>{selectedCrew.status}</p>
          <div className="crew-meta-bar">
            <span>Vehicle: {selectedCrew.vehicle}</span>
            <span>Crew Size: {selectedCrew.crewSize} members</span>
          </div>
        </div>
      )}

      {/* Bottom HUD readout */}
      <div className="hud-badge bottom-right">
        <span>3D DIGITAL TWIN • 4 PATROLS ACTIVE • 1 DRONE SCANNING</span>
      </div>
    </div>
  );
}

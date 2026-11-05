import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import './RealCityMap.css';

const FALLBACK_CENTER = [40.7128, -74.006];

const statusColor = (status) => {
  if (status === 'Resolved') return '#16a36a';
  if (status === 'In progress' || status === 'Assigned') return '#e9a21b';
  if (status === 'Verified') return '#3978d4';
  return '#e14d4d';
};

function makeIssueIcon(issue, selected) {
  const color = statusColor(issue.status);
  return L.divIcon({
    className: 'civiclens-issue-icon-wrap',
    html: `<span class="civiclens-issue-pin${selected ? ' is-selected' : ''}" style="--pin-color:${color}"><span></span></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    popupAnchor: [0, -31]
  });
}

function MapClickHandler({ active, onPinDrop }) {
  useMapEvents({
    click(event) {
      if (active && onPinDrop) {
        onPinDrop({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    }
  });
  return null;
}

function MapViewport({ issues }) {
  const map = useMap();
  const firstIds = issues.map((issue) => issue.id).join('|');

  useEffect(() => {
    if (!issues.length) return;
    if (issues.length === 1) {
      map.setView([Number(issues[0].lat), Number(issues[0].lng)], 15, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(issues.map((issue) => [Number(issue.lat), Number(issue.lng)]));
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15, animate: false });
  // Fit the map when the visible report set changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, firstIds]);
  return null;
}

function MapSearchPosition({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
  }, [map, position?.lat, position?.lng]);

  if (!position) return null;
  const point = [position.lat, position.lng];
  const icon = L.divIcon({
    className: 'civiclens-search-location-wrap',
    html: '<span class="civiclens-search-location"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <>
      <Circle center={point} radius={150} pathOptions={{ color: '#2563eb', weight: 2, fillColor: '#3b82f6', fillOpacity: 0.08 }} />
      <Marker position={point} icon={icon}>
        <Popup>
          <div className="civiclens-map-popup">
            <span className="civiclens-map-popup-id">GPS SEARCH POINT</span>
            <strong>Coordinates searched</strong>
            <span>{position.lat.toFixed(6)}, {position.lng.toFixed(6)}</span>
            <span>Nearby report search radius: 150 m</span>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

function MapControls({ issues, onLocate, locateError }) {
  const map = useMap();
  const controlsRef = useRef(null);

  useEffect(() => {
    if (controlsRef.current) {
      L.DomEvent.disableClickPropagation(controlsRef.current);
      L.DomEvent.disableScrollPropagation(controlsRef.current);
    }
  }, []);

  const fitReports = () => {
    if (!issues.length) {
      map.setView(FALLBACK_CENTER, 14);
      return;
    }
    if (issues.length === 1) {
      map.setView([Number(issues[0].lat), Number(issues[0].lng)], 16);
      return;
    }
    map.fitBounds(L.latLngBounds(issues.map((issue) => [Number(issue.lat), Number(issue.lng)])), { padding: [42, 42], maxZoom: 16 });
  };

  return (
    <div ref={controlsRef} className="civiclens-map-controls" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={fitReports}>Show reports</button>
      <button type="button" onClick={onLocate}>Locate me</button>
      {locateError && <span role="status">{locateError}</span>}
    </div>
  );
}

export default function RealCityMap({
  issues = [],
  selected,
  onSelect,
  searchPosition = null,
  themeMode = 'light',
  onPinDrop,
  isPinDropActive = false
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [locateError, setLocateError] = useState('');
  const validIssues = useMemo(() => issues.filter((issue) => {
    if (issue.lat === null || issue.lat === undefined || issue.lat === '' || issue.lng === null || issue.lng === undefined || issue.lng === '') return false;
    const lat = Number(issue.lat);
    const lng = Number(issue.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }), [issues]);
  const center = validIssues.length
    ? [Number(validIssues[0].lat), Number(validIssues[0].lng)]
    : FALLBACK_CENTER;

  const locateUser = () => {
    setLocateError('');
    if (!navigator.geolocation) {
      setLocateError('Location is unavailable in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setLocateError('');
      },
      () => setLocateError('Allow location access to find your position.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className={`civiclens-real-map-shell ${themeMode === 'dark' ? 'is-dark' : ''} ${isPinDropActive ? 'is-dropping-pin' : ''}`}>
      <MapContainer center={center} zoom={14} scrollWheelZoom className="civiclens-real-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapClickHandler active={isPinDropActive} onPinDrop={onPinDrop} />
        <MapViewport issues={validIssues} />
        <MapSearchPosition position={searchPosition} />
        <MapControls issues={validIssues} onLocate={locateUser} locateError={locateError} />
        {validIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={[Number(issue.lat), Number(issue.lng)]}
            icon={makeIssueIcon(issue, selected?.id === issue.id)}
            eventHandlers={{ click: () => onSelect?.(issue) }}
          >
            <Popup>
              <div className="civiclens-map-popup">
                <span className="civiclens-map-popup-id">{issue.id}</span>
                <strong>{issue.title || issue.type || 'Civic report'}</strong>
                <span>{issue.place || 'Location reported by citizen'}</span>
                <span className="civiclens-map-popup-status" style={{ color: statusColor(issue.status) }}>{issue.status || 'Reported'}</span>
                <button type="button" onClick={() => onSelect?.(issue)}>Open report details</button>
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({ className: 'civiclens-user-location-wrap', html: '<span class="civiclens-user-location"></span>', iconSize: [20, 20], iconAnchor: [10, 10] })}
          />
        )}
        <LocateMapOnSuccess position={userLocation} />
      </MapContainer>
      <div className="civiclens-map-caption">
        <span><i /> {validIssues.length} GPS located {validIssues.length === 1 ? 'report' : 'reports'}</span>
        {isPinDropActive && <strong>Click the map to place your report pin</strong>}
        {searchPosition && <strong>GPS {searchPosition.lat.toFixed(5)}, {searchPosition.lng.toFixed(5)} · reports within 150 m</strong>}
        {searchPosition && !validIssues.length && <span>No saved incident was found within 150 m.</span>}
        {!validIssues.length && <span>Reports without GPS coordinates will appear in the tactical map.</span>}
      </div>
    </div>
  );
}

function LocateMapOnSuccess({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [map, position]);
  return null;
}

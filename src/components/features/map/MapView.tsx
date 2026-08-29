import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Report, ReportStatus, MapAnnouncement } from '@/types';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants/categories';

const STATUS_COLORS: Record<ReportStatus, string> = {
  new: '#DC2626',
  review: '#EA580C',
  accepted: '#CA8A04',
  inprogress: '#2563EB',
  completed: '#16A34A',
  rejected: '#6B7280',
  ignored: '#374151',
};

function createMarkerIcon(status: ReportStatus, votes: number, selected: boolean): L.DivIcon {
  const color = STATUS_COLORS[status];
  const isPulsing = votes > 50;
  const size = selected ? 34 : Math.min(28, 20 + Math.floor(votes / 30));
  const border = selected ? '4px solid #1D4ED8' : '3px solid white';
  const shadow = selected
    ? '0 0 0 3px rgba(37,99,235,0.4), 0 4px 14px rgba(0,0,0,0.3)'
    : '0 3px 10px rgba(0,0,0,0.25)';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:${size + 8}px">
        ${isPulsing ? `<div style="position:absolute;width:${size + 20}px;height:${size + 20}px;border-radius:50%;background:${color};top:${-10}px;left:${-6}px;opacity:0.22;animation:pulse 2s infinite"></div>` : ''}
        <div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:${border};box-shadow:${shadow};transition:all 0.2s"></div>
      </div>`,
    iconSize: [size + 8, size + 4],
    iconAnchor: [Math.floor((size + 8) / 2), size + 4],
  });
}

function createAnnouncementIcon(type: string): L.DivIcon {
  const conf = ANNOUNCEMENT_TYPE_CONFIG[type] || ANNOUNCEMENT_TYPE_CONFIG.other;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${conf.color};
        color:white;
        border-radius:8px;
        padding:4px 8px;
        font-size:11px;
        font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:2px solid white;
        display:flex;
        align-items:center;
        gap:4px;
      ">
        <span>${conf.icon}</span>
        <span>${conf.label}</span>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function SetViewOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  reports: Report[];
  announcements?: MapAnnouncement[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedId?: string;
  selectedAnnouncementId?: string;
  onMarkerClick?: (report: Report) => void;
  onAnnouncementClick?: (a: MapAnnouncement) => void;
  onMapClick?: (lat: number, lng: number) => void;
  drawingPoints?: [number, number][];
  drawingAltPoints?: [number, number][];
}

export default function MapView({
  reports,
  announcements = [],
  center = [41.2995, 69.2401],
  zoom = 12,
  height = '100%',
  selectedId,
  selectedAnnouncementId,
  onMarkerClick,
  onAnnouncementClick,
  onMapClick,
  drawingPoints = [],
  drawingAltPoints = [],
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      zoomControl={true}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <SetViewOnChange center={center} zoom={zoom} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

      {/* ── Report markers ── */}
      {reports.map(report => (
        <Marker
          key={report.id}
          position={[report.location.lat, report.location.lng]}
          icon={createMarkerIcon(report.status, report.votes, report.id === selectedId)}
          eventHandlers={{ click: () => onMarkerClick?.(report) }}
        />
      ))}

      {/* ── Announcement layers ── */}
      {announcements.map(ann => {
        const conf = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.other;
        const isSelected = ann.id === selectedAnnouncementId;

        return (
          <div key={ann.id}>
            {/* Main route / affected area */}
            {ann.route.length >= 2 && (
              <Polyline
                positions={ann.route}
                pathOptions={{
                  color: conf.lineColor,
                  weight: isSelected ? 8 : 5,
                  opacity: ann.status === 'expired' ? 0.3 : 0.85,
                  dashArray: ann.type === 'road_closure' ? '0' : ann.type === 'road_repair' ? '10,6' : '0',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{ click: () => onAnnouncementClick?.(ann) }}
              />
            )}

            {/* Alternative route */}
            {ann.alternativeRoute && ann.alternativeRoute.length >= 2 && (
              <Polyline
                positions={ann.alternativeRoute}
                pathOptions={{
                  color: '#16A34A',
                  weight: isSelected ? 6 : 4,
                  opacity: ann.status === 'expired' ? 0.3 : 0.75,
                  dashArray: '12,5',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{ click: () => onAnnouncementClick?.(ann) }}
              />
            )}

            {/* Label marker at midpoint */}
            {ann.route.length >= 1 && (
              <Marker
                position={ann.route[Math.floor(ann.route.length / 2)]}
                icon={createAnnouncementIcon(ann.type)}
                eventHandlers={{ click: () => onAnnouncementClick?.(ann) }}
              />
            )}
          </div>
        );
      })}

      {/* ── Drawing mode: current points being drawn ── */}
      {drawingPoints.length >= 2 && (
        <Polyline
          positions={drawingPoints}
          pathOptions={{ color: '#DC2626', weight: 4, dashArray: '8,4', opacity: 0.9 }}
        />
      )}
      {drawingPoints.map((pt, i) => (
        <Marker
          key={`dp-${i}`}
          position={pt}
          icon={L.divIcon({
            className: '',
            html: `<div style="width:12px;height:12px;background:#DC2626;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
        />
      ))}
      {drawingAltPoints.length >= 2 && (
        <Polyline
          positions={drawingAltPoints}
          pathOptions={{ color: '#16A34A', weight: 4, dashArray: '10,5', opacity: 0.9 }}
        />
      )}
      {drawingAltPoints.map((pt, i) => (
        <Marker
          key={`ap-${i}`}
          position={pt}
          icon={L.divIcon({
            className: '',
            html: `<div style="width:12px;height:12px;background:#16A34A;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })}
        />
      ))}
    </MapContainer>
  );
}

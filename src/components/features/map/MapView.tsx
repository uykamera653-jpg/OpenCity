import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Report, ReportStatus, MapAnnouncement } from '@/types';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants/categories';
import { toast } from 'sonner';

const STATUS_COLORS: Record<ReportStatus, string> = {
  new: '#DC2626', review: '#EA580C', accepted: '#CA8A04', inprogress: '#2563EB',
  completed: '#16A34A', rejected: '#6B7280', ignored: '#374151',
};

function createMarkerIcon(status: ReportStatus, votes: number, selected: boolean): L.DivIcon {
  const color = STATUS_COLORS[status];
  const isPulsing = votes > 50;
  const size = selected ? 34 : Math.min(28, 20 + Math.floor(votes / 30));
  const border = selected ? '4px solid #1D4ED8' : '3px solid white';
  const shadow = selected ? '0 0 0 3px rgba(37,99,235,0.4), 0 4px 14px rgba(0,0,0,0.3)' : '0 3px 10px rgba(0,0,0,0.25)';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:${size + 8}px">
      ${isPulsing ? `<div style="position:absolute;width:${size + 20}px;height:${size + 20}px;border-radius:50%;background:${color};top:-10px;left:-6px;opacity:.22;animation:pulse 2s infinite"></div>` : ''}
      <div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:${border};box-shadow:${shadow};transition:all .2s"></div>
    </div>`,
    iconSize: [size + 8, size + 4], iconAnchor: [Math.floor((size + 8) / 2), size + 4],
  });
}

function createAnnouncementIcon(type: string): L.DivIcon {
  const conf = ANNOUNCEMENT_TYPE_CONFIG[type] || ANNOUNCEMENT_TYPE_CONFIG.other;
  return L.divIcon({
    className: '',
    html: `<div style="background:${conf.color};color:white;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white;display:flex;align-items:center;gap:4px"><span>${conf.icon}</span><span>${conf.label}</span></div>`,
    iconSize: [0, 0], iconAnchor: [0, 0],
  });
}

function SetViewOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick?.(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function UserLocationControl({ onLocation }: { onLocation?: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const locate = useCallback(() => {
    if (!window.isSecureContext) {
      toast.error('Joylashuv uchun sayt HTTPS orqali ochilishi kerak.');
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Bu qurilmada joylashuv aniqlash qo‘llab-quvvatlanmaydi.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.latitude, coords.longitude];
        setPosition(next);
        setAccuracy(coords.accuracy);
        onLocation?.(coords.latitude, coords.longitude);
        map.flyTo(next, Math.max(map.getZoom(), 17), { duration: 0.8 });
        setLocating(false);
        toast.success('Joylashuvingiz aniqlandi.');
      },
      error => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location ruxsati berilmadi. Brauzer sozlamalaridan Location → Allow ni yoqing.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Joylashuv topilmadi. Telefoningizda GPS/Location yoqilganini tekshiring.');
        } else {
          toast.error('Joylashuvni aniqlash vaqti tugadi. Qayta urinib ko‘ring.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [map, onLocation]);

  const icon = L.divIcon({
    className: '',
    html: '<div style="position:relative;width:22px;height:22px;border-radius:50%;background:#2563EB;border:4px solid white;box-shadow:0 2px 12px rgba(0,0,0,.28)"><div style="position:absolute;inset:-9px;border-radius:50%;background:rgba(37,99,235,.18);animation:markerPulse 2s ease-out infinite"></div></div>',
    iconSize: [22, 22], iconAnchor: [11, 11],
  });

  return <>
    <button type="button" onClick={locate} disabled={locating} aria-label="Mening joylashuvimni aniqlash" title="Mening joylashuvim" className="map-location-control absolute right-4 top-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-lg transition-all hover:bg-gray-50 active:scale-95 disabled:cursor-wait disabled:opacity-70 md:h-12 md:w-12">
      {locating ? <Loader2 className="h-5 w-5 animate-spin text-[#2563EB]" /> : <LocateFixed className="h-5 w-5" />}
    </button>
    {position && <Marker position={position} icon={icon} interactive={false} />}
    {position && accuracy && accuracy < 500 && <Circle center={position} radius={Math.min(Math.max(accuracy, 20), 500)} pathOptions={{ color: '#2563EB', weight: 1, opacity: .3, fillColor: '#2563EB', fillOpacity: .08 }} />}
  </>;
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

export default function MapView({ reports, announcements = [], center = [41.2995, 69.2401], zoom = 12, height = '100%', selectedId, selectedAnnouncementId, onMarkerClick, onAnnouncementClick, onMapClick, drawingPoints = [], drawingAltPoints = [] }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl className="z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <SetViewOnChange center={center} zoom={zoom} />
        <UserLocationControl onLocation={onMapClick} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {reports.map(report => <Marker key={report.id} position={[report.location.lat, report.location.lng]} icon={createMarkerIcon(report.status, report.votes, report.id === selectedId)} eventHandlers={{ click: () => onMarkerClick?.(report) }} />)}

        {announcements.map(ann => {
          const conf = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.other;
          const isSelected = ann.id === selectedAnnouncementId;
          return <div key={ann.id}>
            {ann.route.length >= 2 && <Polyline positions={ann.route} pathOptions={{ color: conf.lineColor, weight: isSelected ? 8 : 5, opacity: ann.status === 'expired' ? .3 : .85, dashArray: ann.type === 'road_closure' ? '0' : ann.type === 'road_repair' ? '10,6' : '0', lineCap: 'round', lineJoin: 'round' }} eventHandlers={{ click: () => onAnnouncementClick?.(ann) }} />}
            {ann.alternativeRoute && ann.alternativeRoute.length >= 2 && <Polyline positions={ann.alternativeRoute} pathOptions={{ color: '#16A34A', weight: isSelected ? 6 : 4, opacity: ann.status === 'expired' ? .3 : .75, dashArray: '12,5', lineCap: 'round', lineJoin: 'round' }} eventHandlers={{ click: () => onAnnouncementClick?.(ann) }} />}
            {ann.route.length >= 1 && <Marker position={ann.route[Math.floor(ann.route.length / 2)]} icon={createAnnouncementIcon(ann.type)} eventHandlers={{ click: () => onAnnouncementClick?.(ann) }} />}
          </div>;
        })}

        {drawingPoints.length >= 2 && <Polyline positions={drawingPoints} pathOptions={{ color: '#DC2626', weight: 4, dashArray: '8,4', opacity: .9 }} />}
        {drawingPoints.map((pt, i) => <Marker key={`dp-${i}`} position={pt} icon={L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#DC2626;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>', iconSize: [12, 12], iconAnchor: [6, 6] })} />)}
        {drawingAltPoints.length >= 2 && <Polyline positions={drawingAltPoints} pathOptions={{ color: '#16A34A', weight: 4, dashArray: '10,5', opacity: .9 }} />}
        {drawingAltPoints.map((pt, i) => <Marker key={`ap-${i}`} position={pt} icon={L.divIcon({ className: '', html: '<div style="width:12px;height:12px;background:#16A34A;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>', iconSize: [12, 12], iconAnchor: [6, 6] })} />)}
      </MapContainer>
    </div>
  );
}

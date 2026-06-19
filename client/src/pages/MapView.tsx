import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { MAP_STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI, CATEGORY_LABELS, getCoordinates } from '@/lib/issueHelpers';
import {
  ArrowLeft, Navigation, MapPin, TrendingUp, Filter,
  Layers, ChevronRight, X, RefreshCw, AlertTriangle
} from 'lucide-react';

// Fix Leaflet default icon paths broken by Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createMarkerIcon = (color: string, size: number = 14) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color};width:${size}px;height:${size}px;
      border-radius:50%;border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      transition:transform .15s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#3b82f6;width:18px;height:18px;border-radius:50%;
    border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,.25);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const TILE_LAYERS = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Street' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' },
};

const MapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const userMarker = useRef<L.Marker | null>(null);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [filtered, setFiltered] = useState<Issue[]>([]);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tileLayer, setTileLayer] = useState<'street' | 'satellite'>('street');
  const currentTile = useRef<L.TileLayer | null>(null);

  // Load issues
  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await apiService.getIssues({ limit: 200 });
      setIssues(res.data.issues);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { loadIssues(); }, []);

  // Apply filters
  useEffect(() => {
    let out = issues;
    if (statusFilter !== 'all') out = out.filter(i => i.status === statusFilter);
    if (categoryFilter !== 'all') out = out.filter(i => i.category === categoryFilter);
    setFiltered(out);
  }, [issues, statusFilter, categoryFilter]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([20.5937, 78.9629], 5);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    currentTile.current = L.tileLayer(TILE_LAYERS.street.url, {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Switch tile layer
  useEffect(() => {
    if (!mapInstance.current) return;
    currentTile.current?.remove();
    currentTile.current = L.tileLayer(TILE_LAYERS[tileLayer].url, {
      attribution: '© OpenStreetMap / Esri',
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, [tileLayer]);

  // Render markers whenever filtered issues change
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    filtered.forEach(issue => {
      const coords = getCoordinates(issue.location);
      if (!coords) return;
      const color = MAP_STATUS_COLOR[issue.status] || '#6b7280';
      const marker = L.marker(coords, { icon: createMarkerIcon(color) });
      marker.on('click', () => {
        setSelected(issue);
        mapInstance.current?.setView(coords, 15, { animate: true });
      });
      marker.bindTooltip(
        `<div style="font-weight:600;font-size:12px">${issue.title}</div>
         <div style="font-size:11px;color:#666">${CATEGORY_LABELS[issue.category] || issue.category}</div>`,
        { direction: 'top', offset: [0, -8] }
      );
      markersLayer.current!.addLayer(marker);
    });
  }, [filtered]);

  const locateUser = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!mapInstance.current) return;
      mapInstance.current.setView([lat, lng], 14, { animate: true });
      userMarker.current?.remove();
      userMarker.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(mapInstance.current)
        .bindPopup('You are here');
    });
  };

  const stats = {
    total:      filtered.length,
    pending:    filtered.filter(i => i.status === 'pending').length,
    inProgress: filtered.filter(i => ['under-review','verified','assigned','work-started'].includes(i.status)).length,
    resolved:   filtered.filter(i => ['completed','closed'].includes(i.status)).length,
  };

  const selectedCoords = selected ? getCoordinates(selected.location) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="border-b bg-background px-4 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <h1 className="font-semibold text-base">Civic Issues Map</h1>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).filter(([v]) => !v.startsWith('road-damage') || v === 'road-damage').map(([v, l]) => (
                  <SelectItem key={v} value={v}>{CATEGORY_EMOJI[v]} {l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Tile switcher */}
            <Button
              variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => setTileLayer(tileLayer === 'street' ? 'satellite' : 'street')}
            >
              <Layers className="h-3.5 w-3.5 mr-1" />
              {tileLayer === 'street' ? 'Satellite' : 'Street'}
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={loadIssues}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="relative flex-1">
            <div ref={mapRef} className="w-full h-full min-h-[500px]" />

            {/* My location button */}
            <Button
              variant="secondary" size="sm"
              onClick={locateUser}
              className="absolute top-4 right-4 z-[1000] shadow-md"
            >
              <Navigation className="h-4 w-4 mr-1.5" /> My Location
            </Button>

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading issues…
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur rounded-lg border shadow-sm p-3 space-y-1.5">
              {[
                ['#f59e0b', 'Pending'],
                ['#6366f1', 'Under Review'],
                ['#3b82f6', 'Assigned'],
                ['#10b981', 'Completed'],
                ['#ef4444', 'Rejected'],
                ['#3b82f6', 'You'],
              ].map(([color, label], i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full shrink-0 border border-white shadow-sm" style={{ background: color }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-background overflow-y-auto flex flex-col">
            {/* Stats */}
            <div className="p-4 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Showing',    value: stats.total,      color: 'text-foreground' },
                  { label: 'Pending',    value: stats.pending,    color: 'text-amber-600' },
                  { label: 'In Progress',value: stats.inProgress, color: 'text-blue-600' },
                  { label: 'Resolved',   value: stats.resolved,   color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-lg p-2.5">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected issue detail */}
            {selected ? (
              <div className="p-4 space-y-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selected Issue</p>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-base leading-snug mb-2">{selected.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge
                      className="text-xs border"
                      style={{ background: MAP_STATUS_COLOR[selected.status] + '20', color: MAP_STATUS_COLOR[selected.status], borderColor: MAP_STATUS_COLOR[selected.status] + '40' }}
                    >
                      {STATUS_LABELS[selected.status] || selected.status}
                    </Badge>
                    {selected.severity && (
                      <Badge variant="outline" className="text-xs">
                        {selected.severity}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_EMOJI[selected.category]} {CATEGORY_LABELS[selected.category] || selected.category}
                    </Badge>
                  </div>

                  {selected.location.address && (
                    <p className="text-sm text-muted-foreground flex items-start gap-1.5 mb-3">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {selected.location.address}
                    </p>
                  )}

                  {/* Images preview */}
                  {selected.images && selected.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3 rounded-lg overflow-hidden">
                      {selected.images.slice(0, 4).map((img, i) => {
                        const src = apiService.getImageUrl(img);
                        return src ? (
                          <div key={i} className="relative aspect-video bg-muted overflow-hidden rounded">
                            <img src={src} alt={`Issue photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            {i === 3 && selected.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                                +{selected.images.length - 4} more
                              </div>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {selected.upvotes?.length ?? 0} upvotes
                    </span>
                    <span>
                      {typeof selected.reportedBy === 'object' ? selected.reportedBy.name : 'Anonymous'}
                    </span>
                  </div>

                  <Link to={`/issue/${selected._id}`}>
                    <Button size="sm" className="w-full">
                      View Full Details <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MapPin className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Click a marker on the map to see issue details.</p>
              </div>
            )}

            {/* Issue list */}
            <div className="border-t">
              <div className="p-4 pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Issues ({filtered.length})
                </p>
              </div>
              <div className="overflow-y-auto max-h-72">
                {filtered.slice(0, 20).map(issue => {
                  const color = MAP_STATUS_COLOR[issue.status] || '#6b7280';
                  const coords = getCoordinates(issue.location);
                  return (
                    <button
                      key={issue._id}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors flex items-start gap-3 ${selected?._id === issue._id ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        setSelected(issue);
                        if (coords && mapInstance.current) mapInstance.current.setView(coords, 15, { animate: true });
                      }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 border border-white shadow-sm" style={{ background: color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{issue.location.address || 'Location not specified'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;

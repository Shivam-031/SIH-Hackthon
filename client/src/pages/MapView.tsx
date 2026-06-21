import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Navbar } from '@/components/Navbar';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { MAP_STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI, CATEGORY_LABELS, getCoordinates } from '@/lib/issueHelpers';
import {
  ArrowLeft, Navigation, MapPin, TrendingUp,
  Layers, ChevronRight, X, RefreshCw, List, SlidersHorizontal,
} from 'lucide-react';

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createMarkerIcon = (color: string, pulse = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color};width:14px;height:14px;
      border-radius:50%;border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,.4);
      ${pulse ? `animation:markerPulse 1.5s ease infinite;` : ''}
    "></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#3b82f6;width:18px;height:18px;border-radius:50%;
    border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,.2);
  "></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

const TILES = {
  street:    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

const MapView = () => {
  const navigate = useNavigate();
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInst     = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const userMarker  = useRef<L.Marker | null>(null);
  const tileRef     = useRef<L.TileLayer | null>(null);

  const [issues,         setIssues]         = useState<Issue[]>([]);
  const [filtered,       setFiltered]       = useState<Issue[]>([]);
  const [selected,       setSelected]       = useState<Issue | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tileLayer,      setTileLayer]      = useState<'street' | 'satellite'>('street');

  // Mobile panels
  const [showList,    setShowList]    = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // Desktop sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await apiService.getIssues({ limit: 200 });
      setIssues(res.data.issues);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { loadIssues(); }, []);

  useEffect(() => {
    let out = issues;
    if (statusFilter !== 'all')   out = out.filter(i => i.status === statusFilter);
    if (categoryFilter !== 'all') out = out.filter(i => i.category === categoryFilter);
    setFiltered(out);
  }, [issues, statusFilter, categoryFilter]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, {
      zoomControl: false,
      // important: don't let Leaflet mess with the page scroll on mobile
      tap: false,
    }).setView([20.5937, 78.9629], 5);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    tileRef.current = L.tileLayer(TILES.street, {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    markerLayer.current = L.layerGroup().addTo(map);
    mapInst.current = map;

    // Invalidate size after layout settles (critical for mobile!)
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapInst.current = null; };
  }, []);

  // Tile layer switch
  useEffect(() => {
    if (!mapInst.current) return;
    tileRef.current?.remove();
    tileRef.current = L.tileLayer(TILES[tileLayer], {
      attribution: '© OpenStreetMap / Esri', maxZoom: 19,
    }).addTo(mapInst.current);
  }, [tileLayer]);

  // Render markers
  useEffect(() => {
    if (!mapInst.current || !markerLayer.current) return;
    markerLayer.current.clearLayers();
    filtered.forEach(issue => {
      const coords = getCoordinates(issue.location);
      if (!coords) return;
      const color  = MAP_STATUS_COLOR[issue.status] || '#6b7280';
      const marker = L.marker(coords, { icon: createMarkerIcon(color, selected?._id === issue._id) });
      marker.on('click', () => {
        setSelected(issue);
        mapInst.current?.setView(coords, 15, { animate: true });
        // On mobile, dismiss list if open
        setShowList(false);
      });
      marker.bindTooltip(
        `<b style="font-size:12px">${issue.title.substring(0, 40)}</b><br/><span style="font-size:11px;color:#555">${CATEGORY_LABELS[issue.category] || issue.category}</span>`,
        { direction: 'top', offset: [0, -8] }
      );
      markerLayer.current!.addLayer(marker);
    });
  }, [filtered, selected?._id]);

  // Invalidate map size when sidebar toggles (desktop)
  useEffect(() => {
    setTimeout(() => mapInst.current?.invalidateSize(), 320);
  }, [sidebarOpen]);

  const locateUser = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (!mapInst.current) return;
      mapInst.current.setView([lat, lng], 14, { animate: true });
      userMarker.current?.remove();
      userMarker.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(mapInst.current).bindPopup('📍 You are here').openPopup();
    });
  };

  const stats = {
    total:      filtered.length,
    pending:    filtered.filter(i => i.status === 'pending').length,
    inProgress: filtered.filter(i => ['under-review','verified','assigned','work-started'].includes(i.status)).length,
    resolved:   filtered.filter(i => ['completed','closed'].includes(i.status)).length,
  };

  const IssueCard = ({ issue }: { issue: Issue }) => {
    const color  = MAP_STATUS_COLOR[issue.status] || '#6b7280';
    const coords = getCoordinates(issue.location);
    const isSelected = selected?._id === issue._id;
    return (
      <button
        className={`w-full text-left px-4 py-3 border-b last:border-b-0 flex items-start gap-3 transition-colors
          ${isSelected ? 'bg-primary/8' : 'hover:bg-muted/50'}`}
        onClick={() => {
          setSelected(issue);
          setShowList(false);
          if (coords && mapInst.current) mapInst.current.setView(coords, 15, { animate: true });
        }}
      >
        <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 border border-white/80 shadow-sm" style={{ background: color }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug line-clamp-1">{issue.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {issue.location.address?.split(',').slice(0, 2).join(',') || 'Location not specified'}
          </p>
        </div>
        <Badge className="text-[10px] px-1.5 py-0 shrink-0" style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
          {STATUS_LABELS[issue.status]?.split(' ')[0] || issue.status}
        </Badge>
      </button>
    );
  };

  const SelectedIssueDetail = () => {
    if (!selected) return null;
    const images = selected.images?.filter(img => apiService.getImageUrl(img)) || [];
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Selected Issue</p>
          <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-semibold text-sm leading-snug">{selected.title}</h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge
            className="text-[10px] border"
            style={{ background: MAP_STATUS_COLOR[selected.status] + '20', color: MAP_STATUS_COLOR[selected.status], borderColor: MAP_STATUS_COLOR[selected.status] + '40' }}
          >
            {STATUS_LABELS[selected.status] || selected.status}
          </Badge>
          {selected.severity && (
            <Badge variant="outline" className="text-[10px]">{selected.severity}</Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_EMOJI[selected.category]} {CATEGORY_LABELS[selected.category] || selected.category}
          </Badge>
        </div>

        {selected.location.address && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {selected.location.address}
          </p>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden">
            {images.slice(0, 4).map((img, i) => {
              const src = apiService.getImageUrl(img);
              return src ? (
                <div key={i} className="relative aspect-video bg-muted overflow-hidden rounded">
                  <img src={src} alt={`photo ${i+1}`} className="w-full h-full object-cover" loading="lazy" />
                  {i === 3 && selected.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xs font-bold">
                      +{selected.images.length - 4}
                    </div>
                  )}
                </div>
              ) : null;
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {selected.upvotes?.length ?? 0} upvotes
          </span>
          <span>{typeof selected.reportedBy === 'object' ? selected.reportedBy.name : 'Anonymous'}</span>
        </div>

        <Link to={`/issue/${selected._id}`} className="block">
          <Button size="sm" className="w-full h-8 text-xs">
            View Full Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    );
  };

  const LEGEND = [
    ['#f59e0b', 'Pending'], ['#6366f1', 'Under Review'],
    ['#3b82f6', 'Assigned'], ['#10b981', 'Completed'], ['#ef4444', 'Rejected'],
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />

      {/* Top control bar */}
      <div className="border-b bg-background px-3 py-2 flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Back</span>
        </Button>
        <h1 className="font-semibold text-sm hidden sm:block">Civic Issues Map</h1>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Filters — inline on desktop, sheet on mobile */}
          <div className="hidden md:flex items-center gap-1.5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(CATEGORY_LABELS)
                  .filter(([v], i, arr) => arr.findIndex(([k]) => k === v) === i)
                  .slice(0, 12)
                  .map(([v, l]) => (
                    <SelectItem key={v} value={v}>{CATEGORY_EMOJI[v]} {l}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Mobile filter button */}
          <Button variant="outline" size="sm" className="h-8 md:hidden gap-1.5 text-xs" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <span className="bg-primary text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold">!</span>
            )}
          </Button>

          <Button
            variant="outline" size="sm" className="h-8 text-xs gap-1"
            onClick={() => setTileLayer(t => t === 'street' ? 'satellite' : 'street')}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tileLayer === 'street' ? 'Satellite' : 'Street'}</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={loadIssues}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="outline" size="sm" className="h-8 w-8 p-0 hidden md:flex"
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Map + optional desktop sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* THE MAP — takes all remaining space */}
        <div className="relative flex-1 min-w-0">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium bg-background/90 rounded-xl px-4 py-3 shadow-lg">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading issues…
              </div>
            </div>
          )}

          {/* My Location button */}
          <Button
            variant="secondary" size="sm"
            onClick={locateUser}
            className="absolute top-3 right-3 z-[1000] shadow-md h-8 text-xs gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">My Location</span>
          </Button>

          {/* Stats bar — mobile top */}
          <div className="absolute top-3 left-3 z-[1000] flex gap-1.5 md:hidden">
            {[
              { label: filtered.length, color: 'text-foreground', bg: 'bg-background/95' },
              { label: `${stats.pending}⏳`, color: 'text-amber-600', bg: 'bg-background/95' },
              { label: `${stats.resolved}✅`, color: 'text-emerald-600', bg: 'bg-background/95' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} ${s.color} text-xs font-semibold px-2 py-1 rounded-lg shadow-sm border backdrop-blur`}>
                {s.label}
              </div>
            ))}
          </div>

          {/* Legend — bottom left */}
          <div className="absolute bottom-16 md:bottom-6 left-3 z-[1000] bg-background/95 backdrop-blur rounded-lg border shadow-sm p-2.5 space-y-1.5">
            {LEGEND.map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full shrink-0 border border-white shadow-sm" style={{ background: color }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* Mobile: selected issue bottom sheet handle */}
          {selected && (
            <div className="absolute bottom-0 left-0 right-0 z-[1000] md:hidden">
              <div className="bg-background border-t rounded-t-2xl shadow-xl max-h-[65vh] overflow-y-auto">
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <SelectedIssueDetail />
              </div>
            </div>
          )}

          {/* Mobile: issue list button */}
          <Button
            variant="default"
            size="sm"
            className="absolute bottom-4 right-3 z-[1000] md:hidden shadow-lg gap-1.5"
            onClick={() => setShowList(true)}
          >
            <List className="h-4 w-4" />
            {filtered.length} Issues
          </Button>
        </div>

        {/* Desktop sidebar */}
        {sidebarOpen && (
          <div className="hidden md:flex w-72 lg:w-80 border-l bg-background flex-col overflow-hidden shrink-0">
            {/* Stats */}
            <div className="p-3 border-b shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overview</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Showing',     value: stats.total,      color: 'text-foreground' },
                  { label: 'Pending',     value: stats.pending,    color: 'text-amber-600' },
                  { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
                  { label: 'Resolved',    value: stats.resolved,   color: 'text-emerald-600' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-lg p-2">
                    <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected issue detail */}
            {selected ? (
              <div className="overflow-y-auto flex-1">
                <SelectedIssueDetail />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mb-2 opacity-25" />
                <p className="text-xs">Tap a marker on the map to see details.</p>
              </div>
            )}

            {/* Issue list */}
            <div className="border-t shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-4 pt-3 pb-1">
                Issues ({filtered.length})
              </p>
              <div className="overflow-y-auto max-h-52">
                {filtered.slice(0, 25).map(issue => (
                  <IssueCard key={issue._id} issue={issue} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Issue list sheet */}
      <Sheet open={showList} onOpenChange={setShowList}>
        <SheetContent side="bottom" className="h-[70vh] p-0 flex flex-col rounded-t-2xl">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="text-base flex items-center justify-between">
              <span>Issues ({filtered.length})</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <span className="text-amber-600 font-medium">{stats.pending} pending</span>
                <span className="text-blue-600 font-medium">{stats.inProgress} active</span>
                <span className="text-emerald-600 font-medium">{stats.resolved} done</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1">
            {filtered.slice(0, 50).map(issue => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No issues match your filters.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile: Filters sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="p-4 rounded-t-2xl space-y-4">
          <SheetTitle>Filter Issues</SheetTitle>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
                <SelectTrigger className="h-10"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Category</p>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); }}>
                <SelectTrigger className="h-10"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([v], i, arr) => arr.findIndex(([k]) => k === v) === i)
                    .slice(0, 12)
                    .map(([v, l]) => (
                      <SelectItem key={v} value={v}>{CATEGORY_EMOJI[v]} {l}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); }}>
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MapView;

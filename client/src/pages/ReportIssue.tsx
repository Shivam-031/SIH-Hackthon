import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import {
  MapPin, Camera, Upload, Loader2, X, CheckCircle, Plus,
  Search, Navigation, Globe, ImagePlus, AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  { value: 'road-damage',    label: '🛣️ Road Damage' },
  { value: 'garbage',        label: '🗑️ Garbage' },
  { value: 'water-leakage',  label: '💧 Water Leakage' },
  { value: 'electricity',    label: '⚡ Electricity' },
  { value: 'street-light',   label: '💡 Street Light' },
  { value: 'illegal-parking',label: '🚗 Illegal Parking' },
  { value: 'pothole',        label: '🕳️ Pothole' },
  { value: 'tree-fallen',    label: '🌳 Tree Fallen' },
  { value: 'pollution',      label: '🌫️ Pollution' },
  { value: 'animal-issue',   label: '🐾 Animal Issue' },
  { value: 'public-safety',  label: '🛡️ Public Safety' },
  { value: 'other',          label: '📋 Other' },
];

const SEVERITIES = [
  { value: 'low',      label: 'Low — Minor inconvenience', color: 'text-green-600' },
  { value: 'medium',   label: 'Medium — Needs attention',  color: 'text-yellow-600' },
  { value: 'high',     label: 'High — Safety concern',     color: 'text-orange-600' },
  { value: 'critical', label: 'Critical — Immediate risk', color: 'text-red-600' },
];

interface ImagePreview {
  file: File;
  previewUrl: string;
}

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', severity: 'medium',
    latitude: '', longitude: '', address: '',
  });
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'none' | 'detecting' | 'set'>('none');
  const [locationQuery, setLocationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [countryFilter, setCountryFilter] = useState<'in' | 'us' | 'global'>('in');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => () => images.forEach(i => URL.revokeObjectURL(i.previewUrl)), [images]);
  useEffect(() => () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = 5 - images.length;
    const toAdd = allowed.slice(0, remaining).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...toAdd]);
    if (allowed.length > remaining) {
      toast({ title: 'Max 5 photos', description: 'Only the first photos were added.', variant: 'destructive' });
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Drag-and-drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [images]);

  // Location search
  const searchLocation = async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
      if (countryFilter !== 'global') url += `&countrycodes=${countryFilter}`;
      const res = await fetch(url);
      setSuggestions(await res.json());
    } catch { /* silent */ } finally { setIsSearching(false); }
  };

  const handleLocationInput = (val: string) => {
    setLocationQuery(val);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchLocation(val), 500);
  };

  const selectSuggestion = (s: any) => {
    setFormData(p => ({ ...p, latitude: s.lat, longitude: s.lon, address: s.display_name }));
    setLocationQuery(s.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationStatus('set');
    toast({ title: '📍 Location set', description: s.display_name.split(',')[0] });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setFormData(p => ({ ...p, latitude: String(latitude), longitude: String(longitude), address }));
        setLocationQuery(address);
        setLocationStatus('set');
        toast({ title: '📍 Location detected' });
      } catch {
        setFormData(p => ({ ...p, latitude: String(latitude), longitude: String(longitude), address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
        setLocationQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setLocationStatus('set');
      }
    }, () => {
      setLocationStatus('none');
      toast({ title: 'Location denied', description: 'Please search for a location manually.', variant: 'destructive' });
    });
  };

  const clearLocation = () => {
    setFormData(p => ({ ...p, latitude: '', longitude: '', address: '' }));
    setLocationQuery(''); setSuggestions([]); setLocationStatus('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.latitude) {
      toast({ title: 'Missing fields', description: 'Fill in title, category, and location.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('severity', formData.severity);
      fd.append('latitude', formData.latitude);
      fd.append('longitude', formData.longitude);
      fd.append('address', formData.address);
      images.forEach(img => fd.append('images', img.file));

      await apiService.createIssue(fd);
      toast({ title: '✅ Issue reported!', description: 'Your report is now pending review.' });
      navigate('/citizen-dashboard');
    } catch (err) {
      toast({ title: 'Submission failed', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'citizen') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-muted-foreground">Only citizens can report issues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
          <p className="text-muted-foreground mt-1">
            Help your community by documenting civic problems with photos and location.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title" placeholder="e.g. Large pothole blocking lane on MG Road"
                  value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Severity</Label>
                  <Select value={formData.severity} onValueChange={v => setFormData(p => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className={s.color}>{s.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description" placeholder="Describe the issue in detail — how long it's been there, safety concerns, etc."
                  rows={4} value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" /> Photos
                <span className="text-sm font-normal text-muted-foreground ml-auto">{images.length}/5</span>
              </CardTitle>
              <CardDescription>Clear photos dramatically speed up issue resolution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              {images.length < 5 && (
                <div
                  ref={dropzoneRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <div className={`rounded-full p-3 mb-3 transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                    <ImagePlus className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-medium">
                    {isDragging ? 'Drop photos here' : 'Click or drag photos here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP · up to 5 MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file" accept="image/*" multiple className="hidden"
                    onChange={e => addFiles(e.target.files)}
                  />
                </div>
              )}

              {/* Image grid preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={img.previewUrl}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white rounded-full p-1.5 shadow-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* File name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate">{img.file.name}</p>
                      </div>
                    </div>
                  ))}
                  {/* Add more button if < 5 */}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <Plus className="h-5 w-5 mb-1" />
                      <span className="text-xs">Add more</span>
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Location <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Country filter */}
              <div className="flex gap-2">
                {[['in','🇮🇳 India'],['us','🇺🇸 USA'],['global','🌍 Global']] .map(([v, l]) => (
                  <Button
                    key={v} type="button" size="sm"
                    variant={countryFilter === v ? 'default' : 'outline'}
                    onClick={() => setCountryFilter(v as 'in' | 'us' | 'global')}
                  >{l}</Button>
                ))}
              </div>

              {/* Search + Detect */}
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-8"
                    placeholder={countryFilter === 'in' ? "Search in India..." : countryFilter === 'us' ? "Search in USA..." : "Search anywhere..."}
                    value={locationQuery}
                    onChange={e => handleLocationInput(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button type="button" variant="outline" onClick={detectLocation} disabled={locationStatus === 'detecting'}>
                  {locationStatus === 'detecting'
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Navigation className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Detect</span>
                </Button>
                {locationStatus === 'set' && (
                  <Button type="button" variant="ghost" size="icon" onClick={clearLocation}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="relative z-20 -mt-2">
                  <div className="absolute w-full bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={i} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted flex gap-3 items-start border-b last:border-b-0"
                        onClick={() => selectSuggestion(s)}
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.display_name.split(',')[0]}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.display_name.split(',').slice(1, 3).join(', ')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmed location */}
              {locationStatus === 'set' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm leading-relaxed">{formData.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting report…</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Submit Issue Report</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;

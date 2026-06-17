import React, { useState, useEffect, useRef } from 'react';
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
  MapPin,
  Camera,
  Upload,
  Loader2,
  X,
  CheckCircle,
  Search,
  Navigation,
  Globe
} from 'lucide-react';

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    category: '',
    location: '',
    address: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [locationDetected, setLocationDetected] = useState(false);
  
  // Location search states
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<object[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<object>(null);
  const [searchCountry, setSearchCountry] = useState<'in' | 'us' | 'global'>('in');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const issueCategories = [
    { value: 'pothole', label: 'Pothole' },
    { value: 'streetlight', label: 'Street Light' },
    { value: 'garbage', label: 'Garbage Collection' },
    { value: 'water-leak', label: 'Water Leak' },
    { value: 'road-damage', label: 'Road Damage' },
    { value: 'traffic-signal', label: 'Traffic Signal' },
    { value: 'drainage', label: 'Drainage Issue' },
    { value: 'other', label: 'Other' }
  ];

  // Location search functions
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`;
      
      // Add country filter based on selection
      if (searchCountry !== 'global') {
        url += `&countrycodes=${searchCountry}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: "Search error",
        description: "Could not search for locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleLocationSearch = (query: string) => {
    setLocationQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query);
    }, 500); // Debounce search by 500ms
  };

  const selectLocation = (location: any) => {
    setSelectedLocation(location);
    setLocationQuery(location.display_name);
    setFormData(prev => ({
      ...prev,
      location: `${location.lat}, ${location.lon}`,
      address: location.display_name
    }));
    setShowSuggestions(false);
    setLocationDetected(true);
    toast({
      title: "Location selected",
      description: "Location has been added to your report.",
    });
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setLocationQuery('');
    setFormData(prev => ({
      ...prev,
      location: '',
      address: ''
    }));
    setLocationDetected(false);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding to get address
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            setSelectedLocation({
              lat: latitude,
              lon: longitude,
              display_name: address
            });
            setLocationQuery(address);
            setFormData(prev => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              address: address
            }));
            setLocationDetected(true);
            toast({
              title: "Location detected",
              description: "Your current location has been added to the report.",
            });
          } catch (error) {
            // Fallback to coordinates only
            setSelectedLocation({
              lat: latitude,
              lon: longitude,
              display_name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            });
            setLocationQuery(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            setFormData(prev => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }));
            setLocationDetected(true);
            toast({
              title: "Location detected",
              description: "Your current location has been added to the report.",
            });
          }
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not detect your location. Please search for a location instead.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.location || !selectedLocation) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a location.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiService.createIssue({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        address: formData.address,
        images: images || [] // TODO: Implement image upload
      });
      
      toast({
        title: "Issue reported successfully!",
        description: "Your civic issue has been submitted for review.",
      });
      
      navigate('/citizen-dashboard');
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'citizen') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Only citizens can report issues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report Civic Issue</h1>
          <p className="text-muted-foreground">
            Help improve your community by reporting civic issues that need attention
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>
              Provide as much detail as possible to help authorities address the issue quickly
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Issue Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Brief, descriptive title of the issue"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detailed description of the issue..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <Label>Location *</Label>
                
                {/* Country Selection */}
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={searchCountry === 'in' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchCountry('in')}
                    className="flex items-center"
                  >
                    🇮🇳 India
                  </Button>
                  <Button
                    type="button"
                    variant={searchCountry === 'us' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchCountry('us')}
                    className="flex items-center"
                  >
                    🇺🇸 USA
                  </Button>
                  <Button
                    type="button"
                    variant={searchCountry === 'global' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchCountry('global')}
                    className="flex items-center"
                  >
                    <Globe className="mr-1 h-3 w-3" />
                    Global
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder={
                          searchCountry === 'in' 
                            ? "Search for a location in India (e.g., 'Mumbai, Maharashtra')"
                            : searchCountry === 'us'
                            ? "Search for a location in USA (e.g., 'New York, NY')"
                            : "Search for any location worldwide"
                        }
                        value={locationQuery}
                        onChange={(e) => {
                          handleLocationSearch(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicking on them
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        className="pl-10"
                        required
                      />
                      {isSearchingLocation && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={detectLocation}
                      className="flex items-center"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Detect
                    </Button>
                    {selectedLocation && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearLocation}
                        className="flex items-center"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Location suggestions dropdown */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
                          onClick={() => selectLocation(suggestion)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {suggestion.display_name.split(',')[0]}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.display_name.split(',').slice(1).join(',').trim()}
                              </p>
                              {suggestion.address && (
                                <p className="text-xs text-blue-600 truncate">
                                  {suggestion.address.state && `${suggestion.address.state}, `}
                                  {suggestion.address.country}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showSuggestions && locationQuery.length >= 3 && !isSearchingLocation && locationSuggestions.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
                      No locations found. Try a different search term or change the country filter.
                    </div>
                  )}
                </div>

                {locationDetected && selectedLocation && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Location selected: {selectedLocation.display_name.split(',')[0]}
                  </div>
                )}

                {/* Hidden input for form submission */}
                <input
                  type="hidden"
                  name="location"
                  value={formData.location}
                />
                <input
                  type="hidden"
                  name="address"
                  value={formData.address}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Photos (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add photos to help illustrate the issue (max 5 images)
                </p>
                
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={images.length >= 5}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${images.length >= 5 ? 'opacity-50' : ''}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 h-6 w-6 flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Submitting...' : 'Submit Issue Report'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;
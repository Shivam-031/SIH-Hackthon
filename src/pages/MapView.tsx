import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Navigation,
  Filter,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import apiService from '@/services/api';
import { type } from 'os';

const MapView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [issues, setnearbyIssues] = useState([]);
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data2 = await apiService.getIssues();
        setnearbyIssues(data2.issues);
        // console.log(data2.issues);
      } catch (error) {
        console.error(error);
      }
    }
    fetchIssues();
  }, []);

  // Mock issues data with coordinates
  const issues2 = [
    {
      id: '1',
      title: 'Multiple potholes on Highway 42',
      category: 'pothole',
      status: 'pending',
      priority: 'high',
      reporter: 'John Doe',
      location: 'Highway 42, Sector 15',
      coordinates: [28.35173, 77.26155],
      date: '2024-01-18',
      upvotes: 24,
      comments: 8,
      verified: true
    },
    {
      id: '2',
      title: 'Street light not working',
      category: 'streetlight',
      status: 'in-progress',
      priority: 'medium',
      reporter: 'Sarah Johnson',
      location: 'Park Avenue, Block C',
      coordinates: [28.618168, 77.367754] as [number, number],
      date: '2024-01-17',
      upvotes: 12,
      comments: 3,
      verified: true
    },
    {
      id: '3',
      title: 'Garbage collection needed',
      category: 'garbage',
      status: 'resolved',
      priority: 'low',
      reporter: 'Mike Wilson',
      location: 'Elm Street',
      coordinates: [40.7505, -73.9934] as [number, number],
      date: '2024-01-16',
      upvotes: 7,
      comments: 2,
      verified: false
    },
    {
      id: '4',
      title: 'Water leak on Park Avenue',
      category: 'water-leak',
      status: 'acknowledged',
      priority: 'high',
      reporter: 'Emily Davis',
      location: 'Park Avenue, Block B',
      coordinates: [40.7614, -73.9776] as [number, number],
      date: '2024-01-19',
      upvotes: 18,
      comments: 5,
      verified: true
    },
    {
      id: '5',
      title: 'Road damage after construction',
      category: 'road-damage',
      status: 'pending',
      priority: 'medium',
      reporter: 'Alex Smith',
      location: 'Broadway Street',
      coordinates: [40.7675, -73.9776] as [number, number],
      date: '2024-01-20',
      upvotes: 15,
      comments: 4,
      verified: true
    },
    {
      id: '6',
      title: 'Traffic signal malfunction',
      category: 'traffic-signal',
      status: 'in-progress',
      priority: 'high',
      reporter: 'Lisa Brown',
      location: '5th Avenue Junction',
      coordinates: [40.7484, -73.9857] as [number, number],
      date: '2024-01-21',
      upvotes: 32,
      comments: 12,
      verified: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'; // yellow/orange
      case 'acknowledged': return '#3b82f6'; // blue
      case 'in-progress': return '#3b82f6'; // blue
      case 'resolved': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground';
      case 'acknowledged': return 'bg-info/10 text-info-foreground';
      case 'in-progress': return 'bg-primary/10 text-primary-foreground';
      case 'resolved': return 'bg-success/10 text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive-foreground';
      case 'medium': return 'bg-warning/10 text-warning-foreground';
      case 'low': return 'bg-success/10 text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13);

            // Add user location marker
            const userMarker = L.marker([latitude, longitude], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }).addTo(mapInstanceRef.current);

            userMarker.bindPopup('Your Location');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.618168, 77.36775], 14);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers for each issue
    const ForMethod = () => {

      issues.forEach((issue) => {
        const {coordinates,latitude,longitude} = issue.location;
        let coordinate ;
        if(coordinates){
          coordinate = [coordinates[1],coordinates[0]] as [number, number];
          // console.log( coordinate);
        }else if(latitude){
          coordinate = [latitude,longitude];
        }else{
          coordinate = [28.618168, 77.36775];
        }
        // console.log( coordinate);

        const marker = L.marker(coordinate || [28.618168, 77.36775], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${getStatusColor(issue.status)}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);
        
        marker.on('click', () => {
          setSelectedIssue(issue);
        });
        
        marker.bindPopup(`
          <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${issue.title}</h3>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">📍 ${issue.location.address}</p>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">Status: <span style="color: ${getStatusColor(issue.status)}; font-weight: bold;">${issue.status}</span></p>
          <p style="margin: 4px 0; color: #666; font-size: 12px;">👍 ${issue.upvotes} upvotes • 💬 ${issue.comments} comments</p>
          </div>
          `);
        })
      } 
      ForMethod();

    return () => {
      map.remove();
    };
  }, [issues]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to view the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/citizen-dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Civic Issues Map</h1>
              <p className="text-muted-foreground">View and explore reported issues in your area</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div ref={mapRef} style={{ height: '600px', width: '100%' }} className="rounded-lg" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="absolute top-4 right-4 z-[1000] bg-white shadow-md hover:bg-slate-50"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    My Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-warning border-2 border-white shadow-sm"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                  <span className="text-sm">In Progress / Acknowledged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-success border-2 border-white shadow-sm"></div>
                  <span className="text-sm">Resolved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white shadow-sm"></div>
                  <span className="text-sm">Your Location</span>
                </div>
              </CardContent>
            </Card>

            {/* Issue Details */}
            {selectedIssue && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{selectedIssue.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {selectedIssue.location.address}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusBadgeColor(selectedIssue.status)}>
                      {selectedIssue.status}
                    </Badge>
                    <Badge className={getPriorityColor(selectedIssue.priority)}>
                      {selectedIssue.priority} priority
                    </Badge>
                    {selectedIssue.verified && (
                      <Badge variant="outline" className="text-success">
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>By {selectedIssue.reportedBy.name}</span>
                    <span>{selectedIssue.date}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {selectedIssue.upvotes}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      {selectedIssue.comments}
                    </span>
                  </div>
                  <Link to={`/issue/${selectedIssue._id}`}>
                  <Button size="sm" className="w-full" >
                    View Full Details
                  </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Issues:</span>
                  <span className="font-semibold">{issues.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending:</span>
                  <span className="font-semibold text-warning">
                    {issues.filter(i => i.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">In Progress:</span>
                  <span className="font-semibold text-primary">
                    {issues.filter(i => i.status === 'in-progress' || i.status === 'acknowledged').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resolved:</span>
                  <span className="font-semibold text-success">
                    {issues.filter(i => i.status === 'resolved').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
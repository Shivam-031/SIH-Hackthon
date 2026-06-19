import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-6xl font-extrabold text-primary mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
        This page doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="flex gap-3 justify-center">
        <Button asChild><Link to="/">Go Home</Link></Button>
        <Button variant="outline" asChild><Link to="/map">View Map</Link></Button>
      </div>
    </div>
  </div>
);

export default NotFound;

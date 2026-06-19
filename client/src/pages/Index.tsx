import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin, Users, Shield, Camera, Award, TrendingUp,
  CheckCircle, ArrowRight, MessageSquare, Zap
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Issues Resolved', value: '2,847', icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Active Citizens',  value: '12,456', icon: Users,       color: 'text-blue-500' },
    { label: 'Gov. Partners',    value: '145',    icon: Shield,      color: 'text-purple-500' },
    { label: 'Cities Covered',   value: '28',     icon: MapPin,      color: 'text-amber-500' },
  ];

  const features = [
    { icon: Camera,       title: 'Report with Photos',          desc: 'Take photos and add GPS location to your civic issue reports for faster processing.' },
    { icon: MessageSquare,title: 'Community Verification',      desc: 'Get reports verified by nearby citizens. More verifications = higher priority.' },
    { icon: Award,        title: 'Earn Civic Points',           desc: 'Build your score by reporting and verifying issues. Climb the leaderboard.' },
    { icon: TrendingUp,   title: 'Track Resolution Progress',   desc: 'Follow every status update from submission to completion, in real time.' },
    { icon: MapPin,       title: 'Live Issue Map',              desc: 'See all civic issues plotted on an interactive map with filters by category and status.' },
    { icon: Zap,          title: 'Instant Notifications',       desc: 'Get notified when your issue status changes or nearby issues are reported.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" /> Community-powered civic tech
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <MapPin className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">CivicConnect</h1>
          </div>
          <h2 className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
            Bridging Communities and Government for Better Cities
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Report potholes, broken streetlights, water leaks and more — with photos and location.
            Watch your city respond. Earn points for contributing.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="shadow-lg shadow-primary/20">
                <Link to="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          ) : (
            <Button size="lg" asChild className="shadow-lg shadow-primary/20">
              <Link to={user.role === 'citizen' ? '/citizen-dashboard' : '/official-dashboard'}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 border-y bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-3">How It Works</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple tools for civic engagement that actually get things fixed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="pt-6">
                  <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-1.5">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-primary to-purple-600">
        <div className="container mx-auto max-w-2xl text-center text-white">
          <h3 className="text-3xl font-bold mb-3">Ready to Make a Difference?</h3>
          <p className="text-white/80 mb-8">
            Join thousands of citizens already making their neighbourhoods better.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Join as Citizen</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white/50 text-white hover:bg-white/10" asChild>
                <Link to="/register">Register as Official</Link>
              </Button>
            </div>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/report-issue">Report an Issue Now</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">CivicConnect</span>
          </div>
          <p>© {new Date().getFullYear()} CivicConnect. Built for better communities.</p>
          <div className="flex gap-4">
            <Link to="/map" className="hover:text-foreground transition-colors">Map</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

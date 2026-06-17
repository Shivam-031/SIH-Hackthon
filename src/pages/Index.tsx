import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Users,
  Shield,
  Camera,
  MessageSquare,
  Award,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const stats = [
    { label: "Issues Resolved", value: "2,847", icon: CheckCircle, color: "text-success" },
    { label: "Active Citizens", value: "12,456", icon: Users, color: "text-primary" },
    { label: "Government Partners", value: "145", icon: Shield, color: "text-info" },
    { label: "Cities Covered", value: "28", icon: MapPin, color: "text-accent" }
  ];

  const features = [
    {
      icon: Camera,
      title: "Report with Evidence",
      description: "Take photos and add location data to your civic issue reports"
    },
    {
      icon: MessageSquare,
      title: "Community Verification",
      description: "Get your reports verified by nearby citizens for faster resolution"
    },
    {
      icon: Award,
      title: "Earn Civic Points",
      description: "Build your civic score by reporting and verifying issues in your community"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor the status of your reports from submission to resolution"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-5xl font-bold text-foreground">CivicConnect</h1>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6">
            Bridging Communities and Government for Better Cities
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Report civic issues, engage with your community, and work together with local authorities 
            to build safer, cleaner, and more livable neighborhoods.
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/register" className="flex items-center">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          ) : (
            <Button size="lg" asChild>
              <Link to={user.role === 'official' ? '/official-dashboard' : '/citizen-dashboard'}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">How It Works</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, effective tools for civic engagement that bring communities and authorities together
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h3>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of citizens already working to improve their communities
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Join as Citizen</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link to="/register">Register as Official</Link>
              </Button>
            </div>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/report-issue">Report Your First Issue</Link>
            </Button>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
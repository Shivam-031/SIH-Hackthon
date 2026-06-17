import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Camera,
  MessageSquare
} from 'lucide-react';
import axios from "axios";
import apiService from '@/services/api';

const CitizenDashboard = () => {
  const { user } = useAuth();

  
  // Mock data - replace with actual API calls
  const myIssues = [
    {
      id: '1',
      title: 'Broken streetlight on Main Street',
      type: 'streetlight',
      status: 'in-progress',
      date: '2024-01-15',
      location: 'Main Street, Block A',
      upvotes: 12,
      comments: 3
    },
    {
      id: '2',
      title: 'Pothole near school entrance',
      type: 'pothole',
      status: 'resolved',
      date: '2024-01-10',
      location: 'School Road',
      upvotes: 8,
      comments: 5
    }
  ];
  const [ApiData,setApiData] = useState({nearbyIssues:[],myIssues:[]});
  useEffect(() => {
    const fetchData = async () => {
      try {
        const Neardata = await apiService.getIssues();
        const Mydata = await apiService.getMyIssues();
        setApiData({nearbyIssues:Neardata.issues,myIssues:Mydata.issues});
        // console.log(Mydata);
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
    
  },[])
// console.log(ApiData);

  // const nearbyIssues = [
  //   {
  //     id: '3',
  //     title: 'Garbage pile needs collection',
  //     type: 'garbage',
  //     status: 'pending',
  //     date: '2024-01-18',
  //     location: '0.2km away',
  //     needsVerification: true
  //   },
  //   {
  //     id: '4',
  //     title: 'Water leak on Park Avenue',
  //     type: 'water-leak',
  //     status: 'acknowledged',
  //     date: '2024-01-17',
  //     location: '0.5km away',
  //     needsVerification: false
  //   }
  // ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning-foreground';
      case 'acknowledged': return 'bg-info/10 text-info-foreground';
      case 'in-progress': return 'bg-primary/10 text-primary-foreground';
      case 'resolved': return 'bg-success/10 text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertTriangle;
      case 'acknowledged': return Clock;
      case 'in-progress': return Clock;
      case 'resolved': return CheckCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              Track your reports and help verify issues in your community
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button asChild>
              <Link to="/report-issue" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{user?.civicScore || 150}</p>
                  <p className="text-xs text-muted-foreground">Civic Score</p>
                </div>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{myIssues.length}</p>
                  <p className="text-xs text-muted-foreground">My Reports</p>
                </div>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-muted-foreground">Rank</p>
                </div>
                <Users className="h-4 w-4 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="mr-2 h-5 w-5" />
                My Issues
              </CardTitle>
              <CardDescription>
                Issues you've reported to the community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ApiData.myIssues.map((issue) => {
                const StatusIcon = getStatusIcon(issue.status);
                return (
                  <div key={issue._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link
                          to={`/issue/${issue._id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {issue.title}
                        </Link>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <MapPin className="mr-1 h-3 w-3" />
                          {issue.location.address}
                        </p>
                      </div>
                      <Badge className={getStatusColor(issue.status)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {issue.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{issue.date}</span>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {issue.upvotes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {issue.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button variant="outline" className="w-full" asChild>
                <Link to="/report-issue">Report New Issue</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Nearby Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Nearby Issues
              </CardTitle>
              <CardDescription>
                Help verify issues in your area to earn civic points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ApiData.nearbyIssues.map((issue,index) => {
                const StatusIcon = getStatusIcon(issue.status);
                
                return (
                  
                  <div key={issue._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link
                          to={`/issue/${issue._id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {issue.title}
                        </Link>
                        <p className="text-sm text-muted-foreground flex items-center mt-1">
                          <MapPin className="mr-1 h-3 w-3" />
                          {issue.location.address}
                        </p>
                      </div>
                      <Badge className={getStatusColor(issue.status)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {issue.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{issue.date}</span>
                      {issue.needsVerification && (
                        <Button size="sm" variant="outline">
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              <Button variant="outline" className="w-full" asChild>
                <Link to="/map">View Map</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
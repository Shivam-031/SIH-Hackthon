import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  TrendingUp,
  Calendar,
  Edit2,
  Save,
  X,
  Star,
  CheckCircle,
  Clock,
  Camera
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Mock data - replace with actual API calls
  const stats = {
    issuesReported: 12,
    issuesVerified: 28,
    issuesResolved: 8,
    civicScore: user?.civicScore || 150,
    rank: 15,
    joinDate: '2023-08-15'
  };

  const badges = [
    { name: 'Verified Reporter', description: 'Reported 10+ verified issues', earned: true, icon: CheckCircle },
    { name: 'Community Helper', description: 'Verified 25+ issues', earned: true, icon: Award },
    { name: 'Top Contributor', description: 'Top 20 civic score in your area', earned: true, icon: Star },
    { name: 'Quick Responder', description: 'Verify issues within 1 hour', earned: false, icon: Clock }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'reported',
      title: 'Broken streetlight on Oak Avenue',
      date: '2024-01-18',
      status: 'in-progress',
      points: 10
    },
    {
      id: '2',
      type: 'verified',
      title: 'Pothole on Main Street',
      date: '2024-01-17',
      status: 'confirmed',
      points: 5
    },
    {
      id: '3',
      type: 'resolved',
      title: 'Garbage collection needed',
      date: '2024-01-15',
      status: 'resolved',
      points: 15
    }
  ];

  const handleSave = () => {
    // Mock save operation
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'reported': return Camera;
      case 'verified': return CheckCircle;
      case 'resolved': return Award;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'reported': return 'text-primary';
      case 'verified': return 'text-info';
      case 'resolved': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <Badge variant={user.role === 'official' ? 'default' : 'secondary'}>
                    {user.role === 'official' ? 'Government Official' : 'Citizen'}
                  </Badge>
                  {user.verified && (
                    <Badge variant="outline" className="text-success border-success">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {user.role === 'citizen' && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{stats.civicScore}</p>
                    <p className="text-sm text-muted-foreground">Civic Score</p>
                    <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      Rank #{stats.rank} in your area
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(stats.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card for Citizens */}
            {user.role === 'citizen' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{stats.issuesReported}</p>
                      <p className="text-xs text-muted-foreground">Issues Reported</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{stats.issuesResolved}</p>
                      <p className="text-xs text-muted-foreground">Issues Resolved</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-info">{stats.issuesVerified}</p>
                    <p className="text-xs text-muted-foreground">Issues Verified</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                <TabsTrigger value="badges" className="flex-1">Badges</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Overview</CardTitle>
                    <CardDescription>
                      Your civic engagement summary and recent contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.role === 'citizen' ? (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          You've been an active contributor to your community with {stats.issuesReported} reported issues 
                          and {stats.issuesVerified} verifications. Keep up the great work!
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-4 border rounded-lg">
                            <Camera className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="font-medium">Reporter</p>
                            <p className="text-xs text-muted-foreground">Help identify issues</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                            <p className="font-medium">Verifier</p>
                            <p className="text-xs text-muted-foreground">Confirm issue validity</p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <Award className="h-6 w-6 text-accent mx-auto mb-2" />
                            <p className="font-medium">Contributor</p>
                            <p className="text-xs text-muted-foreground">Build civic score</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Government Official</h3>
                        <p className="text-muted-foreground">
                          Manage and resolve civic issues in your jurisdiction through the official dashboard.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest contributions to the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => {
                        const ActivityIcon = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                              <ActivityIcon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{activity.title}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="capitalize">{activity.type}</span>
                                <span>{activity.date}</span>
                                <Badge variant="outline" className="text-xs">
                                  +{activity.points} points
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="badges" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Achievement Badges</CardTitle>
                    <CardDescription>
                      Recognition for your civic contributions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {badges.map((badge, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg ${
                            badge.earned ? 'border-primary/20 bg-primary/5' : 'border-muted bg-muted/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${badge.earned ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              <badge.icon className="h-4 w-4" />
                            </div>
                            
                            <div>
                              <p className="font-medium text-foreground">{badge.name}</p>
                              <p className="text-sm text-muted-foreground">{badge.description}</p>
                              {badge.earned && (
                                <Badge className="mt-2 text-xs">Earned</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </div>
                    
                    <Button
                      variant={isEditing ? "ghost" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleSave} className="flex items-center">
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
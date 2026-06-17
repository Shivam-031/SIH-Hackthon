import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  MessageSquare,
  Camera,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Share,
  Flag
} from 'lucide-react';
import apiService from '@/services/api';
import { title } from 'process';
import axios from 'axios';

const IssueDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [ userInfo, setUser ] = useState({id: "",title:"",description:"",reportedBy:{name:""},location:{address:"",latitude:"",longitude:""},images:[{filename:""},{filename:""}]});
    useEffect(() => {
      const LoadIssue = async () => {
        const res = await apiService.getIssue(id)
        setUser(res.issue);
      }
      LoadIssue();
    },[id]);
        
  const issue = {
    id: id || '1',
    title: userInfo.title ||'Broken streetlight on Main Street',
    description: userInfo.description||'The streetlight at the corner of Main Street and Oak Avenue has been non-functional for over a week. This creates a safety hazard for pedestrians and drivers, especially during evening hours. The light appears to be completely out and may need electrical repair or bulb replacement.',
    category: 'streetlight',
    status: 'in-progress',
    priority: 'high',
    reporter: {
      name:userInfo.reportedBy.name||'Sarah Johnson',
      avatar: '',
      civicScore: 245
    },
    location: {
      address:userInfo.location.address||'Main Street & Oak Avenue, Downtown',
      coordinates:userInfo.location.latitude?`${userInfo.location.latitude},${userInfo.location.longitude}` :'40.7128, -74.0060'
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    upvotes: 24,
    comments: 6,
    images: [
      `http://localhost:5000/api/issues/image/${userInfo.images[0].filename}`,
      `http://localhost:5000/api/issues/image/${userInfo.images[1].filename} `
    ],
    verifications: [
      {
        id: '1',
        user: 'Mike Wilson',
        type: 'confirm',
        comment: 'Can confirm, light has been out for several days',
        timestamp: '2024-01-16T09:15:00Z'
      },
      {
        id: '2',
        user: 'Lisa Chen',
        type: 'confirm',
        comment: 'Very dangerous at night, needs immediate attention',
        timestamp: '2024-01-16T18:45:00Z'
      }
    ],
    assignedTo: 'Public Works Department',
    estimatedResolution: '2024-01-22'
  };

  const comments = [
    {
      id: '1',
      user: 'John Doe',
      avatar: '',
      comment: 'I noticed this too. It\'s been dark for about a week now.',
      timestamp: '2024-01-16T12:30:00Z',
      civicScore: 180
    },
    {
      id: '2',
      user: 'Emily Parker',
      avatar: '',
      comment: 'Thanks for reporting this! I walk this route every evening.',
      timestamp: '2024-01-17T19:15:00Z',
      civicScore: 95
    }
  ];
// console.log(userInfo)
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive-foreground';
      case 'medium': return 'bg-warning/10 text-warning-foreground';
      case 'low': return 'bg-success/10 text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleUpvote = () => {
    setHasUpvoted(!hasUpvoted);
    toast({
      title: hasUpvoted ? "Upvote removed" : "Issue upvoted",
      description: hasUpvoted ? "Your support has been removed" : "Thanks for supporting this issue!",
    });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    
    // Mock comment submission
    toast({
      title: "Comment added",
      description: "Your comment has been posted.",
    });
    setComment('');
  };

  const handleVerification = (type: 'confirm' | 'deny') => {
    toast({
      title: `Issue ${type}ed`,
      description: `You have ${type}ed this issue. Thank you for your contribution!`,
    });
  };

  const StatusIcon = getStatusIcon(issue.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={user?.role === 'official' ? '/official-dashboard' : '/citizen-dashboard'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Issue Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getStatusColor(issue.status)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {issue.status}
                  </Badge>
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    {issue.category}
                  </Badge>
                </div>
                
                <CardTitle className="text-2xl">{issue.title}</CardTitle>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    Reported by {issue.reporter.name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-1 h-4 w-4" />
                    {issue.location.address}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <p className="text-foreground leading-relaxed">{issue.description}</p>
                
                {/* Images */}
                {issue.images && issue.images.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Photos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {issue.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant={hasUpvoted ? "default" : "outline"}
                    onClick={handleUpvote}
                    className="flex items-center"
                  >
                    <ThumbsUp className={`mr-2 h-4 w-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                    {issue.upvotes + (hasUpvoted ? 1 : 0)} Upvotes
                  </Button>
                  
                  {user?.role === 'citizen' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleVerification('confirm')}
                        className="flex items-center text-success border-success hover:bg-success/10"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleVerification('deny')}
                        className="flex items-center text-destructive border-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Deny
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Community Verifications */}
            {issue.verifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Verifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issue.verifications.map((verification) => (
                    <div key={verification.id} className="flex items-start gap-3">
                      <div className={`p-1 rounded-full ${verification.type === 'confirm' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {verification.type === 'confirm' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{verification.user}</p>
                        <p className="text-sm text-muted-foreground">{verification.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(verification.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Add Comment */}
                {user && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleComment} disabled={!comment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                )}
                
                <Separator />
                
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.user}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.civicScore} civic score
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Issue Status */}
       
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned to</p>
                  <p className="text-foreground">{issue.assignedTo}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last updated</p>
                  <p className="text-foreground">{new Date(issue.updatedAt).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated resolution</p>
                  <p className="text-foreground">{new Date(issue.estimatedResolution).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Reporter Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reporter Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  
                  <Avatar>
                    <AvatarImage src={issue.reporter.avatar} />
                    <AvatarFallback>{issue.reporter.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-medium text-foreground">{issue.reporter.name}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      Civic Score: {issue.reporter.civicScore||0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground">{issue.location.address}</p>
                <p className="text-sm text-muted-foreground">
                  Coordinates: {issue.location.coordinates}
                </p>
                <Link to='/map'>
                <Button variant="outline" className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  View on Map
                </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;
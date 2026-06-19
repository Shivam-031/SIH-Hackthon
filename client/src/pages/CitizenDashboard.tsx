import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/issueHelpers';
import {
  Plus, MapPin, Clock, CheckCircle, AlertTriangle,
  TrendingUp, Camera, ThumbsUp, Map, Award, Star,
  Loader2, ChevronRight, RefreshCw
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [mine, recent] = await Promise.all([
        apiService.getMyIssues(),
        apiService.getIssues({ limit: 6, sortBy: 'createdAt', order: 'desc' }),
      ]);
      setMyIssues(mine.data.issues);
      setRecentIssues(recent.data.issues);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resolved = myIssues.filter(i => ['completed', 'closed', 'resolved'].includes(i.status)).length;
  const pending  = myIssues.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Track your reports and contribute to your community.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/report-issue"><Plus className="mr-1.5 h-4 w-4" /> Report Issue</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Civic Points',  value: user?.points ?? user?.civicScore ?? 0, icon: Award,       color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'My Reports',    value: myIssues.length,                        icon: Camera,      color: 'text-blue-500',  bg: 'bg-blue-50' },
            { label: 'Resolved',      value: resolved,                               icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Level',         value: user?.level ?? 'Bronze',               icon: Star,        color: 'text-purple-500', bg: 'bg-purple-50', isText: true },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${s.isText ? 'text-base mt-1' : ''}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                  <div className={`${s.bg} p-2.5 rounded-xl`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Issues */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" /> My Reports
                </CardTitle>
                <Badge variant="secondary">{myIssues.length}</Badge>
              </div>
              <CardDescription className="text-xs">Issues you've reported to the community</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myIssues.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Camera className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No reports yet.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/report-issue">Report your first issue</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myIssues.slice(0, 5).map(issue => (
                    <Link key={issue._id} to={`/issue/${issue._id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group">
                        <span className="text-lg mt-0.5">{CATEGORY_EMOJI[issue.category] || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{issue.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLOR[issue.status] || 'bg-muted'}`}>
                              {STATUS_LABELS[issue.status] || issue.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <ThumbsUp className="h-2.5 w-2.5" /> {issue.upvotes?.length ?? 0}
                            </span>
                            {issue.location.address && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{issue.location.address.split(',')[0]}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                    </Link>
                  ))}
                  {myIssues.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{myIssues.length - 5} more issues
                    </p>
                  )}
                </div>
              )}
              <div className="pt-3 border-t mt-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/report-issue"><Plus className="h-4 w-4 mr-1.5" /> Report New Issue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Community Issues */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Community Issues
                </CardTitle>
                <Badge variant="secondary">{recentIssues.length}</Badge>
              </div>
              <CardDescription className="text-xs">Recent issues near you — help verify them to earn points</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentIssues.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No community issues found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentIssues.map(issue => (
                    <Link key={issue._id} to={`/issue/${issue._id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group">
                        <span className="text-lg mt-0.5">{CATEGORY_EMOJI[issue.category] || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{issue.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLOR[issue.status] || 'bg-muted'}`}>
                              {STATUS_LABELS[issue.status] || issue.status}
                            </Badge>
                            {issue.status === 'pending' && (
                              <span className="text-[10px] text-amber-600 font-medium">Needs verification</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t mt-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/map"><Map className="h-4 w-4 mr-1.5" /> View on Map</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;

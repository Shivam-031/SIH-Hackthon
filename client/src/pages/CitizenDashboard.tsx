import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI } from '@/lib/issueHelpers';
import {
  Plus, MapPin, CheckCircle, Camera,
  ThumbsUp, Map, Award, Star,
  Loader2, ChevronRight, RefreshCw, TrendingUp,
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [myIssues,     setMyIssues]     = useState<Issue[]>([]);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading,      setLoading]      = useState(true);

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

  const resolved = myIssues.filter(i => ['completed','closed','resolved'].includes(i.status)).length;

  const IssueRow = ({ issue }: { issue: Issue }) => (
    <Link to={`/issue/${issue._id}`}>
      <div className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-muted/60 active:bg-muted transition-colors group">
        <span className="text-xl shrink-0 mt-0.5">{CATEGORY_EMOJI[issue.category] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
            {issue.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLOR[issue.status] || 'bg-muted'}`}>
              {STATUS_LABELS[issue.status] || issue.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <ThumbsUp className="h-2.5 w-2.5" /> {issue.upvotes?.length ?? 0}
            </span>
            {issue.location.address && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 min-w-0">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate max-w-[120px]">{issue.location.address.split(',')[0]}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Hi, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Track your reports and help your community.
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:w-auto sm:px-3" onClick={load} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1.5">Refresh</span>
            </Button>
            <Button size="sm" className="h-8" asChild>
              <Link to="/report-issue">
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Report Issue</span>
                <span className="sm:hidden">Report</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats — 2×2 on mobile, 4 in a row on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
          {[
            { label: 'Civic Points',  value: user?.points ?? 0,         icon: Award,       color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'My Reports',    value: myIssues.length,            icon: Camera,      color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Resolved',      value: resolved,                   icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Level',         value: user?.level ?? 'Bronze',    icon: Star,        color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/30', isText: true },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 sm:pt-5 sm:px-4 sm:pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-bold leading-none ${s.isText ? 'text-sm mt-0.5' : 'text-xl sm:text-2xl'}`}>
                      {s.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                  <div className={`${s.bg} p-2 rounded-lg shrink-0`}>
                    <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two column on md+, stacked on mobile */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* My Issues */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" /> My Reports
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{myIssues.length}</Badge>
              </div>
              <CardDescription className="text-xs">Issues you've reported</CardDescription>
            </CardHeader>
            <CardContent className="px-1 sm:px-3 pb-3">
              {loading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : myIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No reports yet.</p>
                  <Button variant="outline" size="sm" className="mt-3 h-8 text-xs" asChild>
                    <Link to="/report-issue">Report your first issue</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  {myIssues.slice(0, 5).map(issue => (
                    <IssueRow key={issue._id} issue={issue} />
                  ))}
                  {myIssues.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground pt-1 pb-2">
                      +{myIssues.length - 5} more
                    </p>
                  )}
                </div>
              )}
              <div className="pt-2 border-t mt-1 px-2">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                  <Link to="/report-issue"><Plus className="h-3.5 w-3.5 mr-1.5" /> Report New Issue</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Community Issues */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Community
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{recentIssues.length}</Badge>
              </div>
              <CardDescription className="text-xs">Help verify to earn points</CardDescription>
            </CardHeader>
            <CardContent className="px-1 sm:px-3 pb-3">
              {loading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No community issues.</p>
                </div>
              ) : (
                <div>
                  {recentIssues.map(issue => (
                    <IssueRow key={issue._id} issue={issue} />
                  ))}
                </div>
              )}
              <div className="pt-2 border-t mt-1 px-2">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                  <Link to="/map"><Map className="h-3.5 w-3.5 mr-1.5" /> View on Map</Link>
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

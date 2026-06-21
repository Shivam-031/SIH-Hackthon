import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/issueHelpers';
import {
  BarChart3, Clock, CheckCircle, AlertTriangle, Users,
  MapPin, TrendingUp, RefreshCw, ChevronRight,
  Search, Loader2, ShieldCheck, Filter,
} from 'lucide-react';

const OfficialDashboard = () => {
  const { toast } = useToast();
  const [issues,      setIssues]      = useState<Issue[]>([]);
  const [stats,       setStats]       = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [updatingId,  setUpdatingId]  = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [issueRes, dashRes] = await Promise.all([
        apiService.getAdminIssues({
          page,
          status:   statusFilter   !== 'all' ? statusFilter   : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
        apiService.getAdminDashboard(),
      ]);
      setIssues(issueRes.data.issues);
      setTotalPages(issueRes.data.pagination.pages);
      setStats(dashRes.data.stats);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, statusFilter, categoryFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await apiService.updateIssueStatus(id, status);
      toast({ title: '✅ Status updated' });
      load();
    } catch { toast({ title: 'Update failed', variant: 'destructive' }); }
    finally { setUpdatingId(null); }
  };

  const filtered = issues.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const STAT_CARDS = [
    { key: 'totalIssues',    label: 'Total',    icon: AlertTriangle, color: 'text-primary',     bg: 'bg-primary/10' },
    { key: 'pendingIssues',  label: 'Pending',  icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { key: 'openIssues',     label: 'Open',     icon: BarChart3,     color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { key: 'closedIssues',   label: 'Closed',   icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { key: 'totalUsers',     label: 'Citizens', icon: Users,         color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { key: 'criticalIssues', label: 'Critical', icon: ShieldCheck,   color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/30' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-7xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Official Dashboard</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              Manage and resolve civic issues.
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1.5">Refresh</span>
          </Button>
        </div>

        {/* Stats — 3 cols on mobile, 6 on lg */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5 sm:mb-8">
          {STAT_CARDS.map(s => (
            <Card key={s.key} className="shadow-sm border-0">
              <CardContent className="p-2.5 sm:p-4">
                <div className={`inline-flex p-1.5 sm:p-2 rounded-lg mb-1.5 ${s.bg}`}>
                  <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} />
                </div>
                <p className="text-lg sm:text-xl font-bold leading-none">{stats[s.key] ?? '—'}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="issues">
          <TabsList className="bg-background border mb-4 h-9">
            <TabsTrigger value="issues" className="text-xs sm:text-sm">Issues</TabsTrigger>
            <TabsTrigger value="map" className="text-xs sm:text-sm">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search issues…"
                  className="pl-8 h-8 text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-32 sm:w-40 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-32 sm:w-40 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {['road-damage','garbage','water-leakage','electricity','street-light','pothole','tree-fallen','pollution','other'].map(c => (
                    <SelectItem key={c} value={c} className="text-xs">{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="shadow-sm border-0 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No issues match your filters.</p>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="divide-y md:hidden">
                    {filtered.map(issue => (
                      <div key={issue._id} className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{issue.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {CATEGORY_EMOJI[issue.category]} {CATEGORY_LABELS[issue.category] || issue.category}
                            </p>
                          </div>
                          <Link to={`/issue/${issue._id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`text-[10px] border ${STATUS_COLOR[issue.status] || 'bg-muted'}`}>
                            {STATUS_LABELS[issue.status] || issue.status}
                          </Badge>
                          {issue.location.address && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[160px]">
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              {issue.location.address.split(',')[0]}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                            <TrendingUp className="h-2.5 w-2.5" />
                            {issue.upvotes?.length ?? 0}
                          </span>
                        </div>
                        <Select
                          value={issue.status}
                          onValueChange={v => updateStatus(issue._id, v)}
                          disabled={updatingId === issue._id}
                        >
                          <SelectTrigger className="h-7 text-xs w-full">
                            {updatingId === issue._id
                              ? <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Updating…</span>
                              : <SelectValue />
                            }
                          </SelectTrigger>
                          <SelectContent>
                            {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                              <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Issue</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Category</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden lg:table-cell">Location</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Votes</th>
                          <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Update</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map(issue => (
                          <tr key={issue._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium truncate max-w-[180px] text-sm">{issue.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(issue.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {CATEGORY_EMOJI[issue.category]} {CATEGORY_LABELS[issue.category] || issue.category}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`text-[10px] border ${STATUS_COLOR[issue.status] || ''}`}>
                                {STATUS_LABELS[issue.status] || issue.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
                                {issue.location.address?.split(',')[0] || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                {issue.upvotes?.length ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={issue.status}
                                onValueChange={v => updateStatus(issue._id, v)}
                                disabled={updatingId === issue._id}
                              >
                                <SelectTrigger className="h-7 text-xs w-36">
                                  {updatingId === issue._id
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <SelectValue />
                                  }
                                </SelectTrigger>
                                <SelectContent>
                                  {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                                    <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Link to={`/issue/${issue._id}`}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="shadow-sm border-0">
              <CardContent className="p-6 sm:p-10 text-center">
                <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-medium mb-1 sm:text-lg">Full Map View</p>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                  See all civic issues plotted on an interactive map with status and category filters.
                </p>
                <Button asChild><Link to="/map">Open Map</Link></Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OfficialDashboard;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { STATUS_COLOR, STATUS_LABELS, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/issueHelpers';
import {
  BarChart3, Clock, CheckCircle, AlertTriangle, Users,
  MapPin, Download, TrendingUp, RefreshCw, ChevronRight,
  Search, Filter, Loader2, ShieldCheck
} from 'lucide-react';

const OfficialDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [issueRes, dashRes] = await Promise.all([
        apiService.getAdminIssues({
          page,
          status: statusFilter !== 'all' ? statusFilter : undefined,
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
    { key: 'totalIssues',   label: 'Total Issues',  icon: AlertTriangle, color: 'text-primary',   bg: 'bg-primary/10' },
    { key: 'pendingIssues', label: 'Pending',        icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'openIssues',    label: 'Open',           icon: BarChart3,     color: 'text-blue-600',  bg: 'bg-blue-50' },
    { key: 'closedIssues',  label: 'Closed',         icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'totalUsers',    label: 'Citizens',       icon: Users,         color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'criticalIssues',label: 'Critical',       icon: ShieldCheck,   color: 'text-red-600',   bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Official Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage and resolve civic issues across your jurisdiction.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {STAT_CARDS.map(s => (
            <Card key={s.key} className="shadow-sm border-0">
              <CardContent className="pt-4 pb-4">
                <div className={`inline-flex p-2 rounded-lg mb-2 ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xl font-bold">{stats[s.key] ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="issues" className="space-y-6">
          <TabsList className="bg-background border">
            <TabsTrigger value="issues">Issue Management</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues…"
                  className="pl-9 h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-40 text-sm"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {['road-damage','garbage','water-leakage','electricity','street-light','pothole','tree-fallen','pollution','other'].map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c] || c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issues table */}
            <Card className="shadow-sm border-0 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Filter className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No issues match your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Issue</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden lg:table-cell">Location</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs hidden md:table-cell">Upvotes</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Update</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map(issue => (
                        <tr key={issue._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium truncate max-w-[200px]">{issue.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm">{CATEGORY_EMOJI[issue.category]} {CATEGORY_LABELS[issue.category] || issue.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] border ${STATUS_COLOR[issue.status] || 'bg-muted'}`}>
                              {STATUS_LABELS[issue.status] || issue.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                              {issue.location.address?.split(',')[0] || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-sm">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                              {issue.upvotes?.length ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Select
                                value={issue.status}
                                onValueChange={v => updateStatus(issue._id, v)}
                                disabled={updatingId === issue._id}
                              >
                                <SelectTrigger className="h-7 text-xs w-32">
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
                            </div>
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="shadow-sm border-0">
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="font-medium mb-1">Full Map View</p>
                <p className="text-sm text-muted-foreground mb-4">See all issues plotted on an interactive map with filters.</p>
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

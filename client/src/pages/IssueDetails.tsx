import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import type { Issue } from '@/types';
import { STATUS_LABELS, STATUS_COLOR, SEVERITY_COLOR, CATEGORY_LABELS, CATEGORY_EMOJI } from '@/lib/issueHelpers';
import {
  ArrowLeft, MapPin, ThumbsUp, CheckCircle, X,
  Clock, AlertTriangle, ChevronLeft, ChevronRight,
  ZoomIn, Share2, CalendarDays, Shield, TrendingUp, Loader2
} from 'lucide-react';

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyComment, setVerifyComment] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  const loadIssue = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiService.getIssue(id);
      setIssue(res.data.issue);
      if (user) {
        setHasUpvoted(res.data.issue.upvotes?.includes(user._id || user.id));
        setHasVerified((res.data.issue.verifiedBy ?? []).includes(user._id || user.id));
      }
    } catch {
      toast({ title: 'Failed to load issue', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadIssue(); }, [id]);

  const handleUpvote = async () => {
    if (!user || !issue) return;
    setUpvoteLoading(true);
    try {
      const res = await apiService.upvoteIssue(issue._id);
      setHasUpvoted(!hasUpvoted);
      setIssue(prev => prev ? { ...prev, upvotes: Array(res.data.upvotes).fill('') } : prev);
      toast({ title: hasUpvoted ? 'Upvote removed' : '👍 Upvoted!' });
    } catch (err) {
      toast({ title: 'Failed to upvote', variant: 'destructive' });
    } finally { setUpvoteLoading(false); }
  };

  const handleVerify = async () => {
    if (!user || !issue) return;
    setVerifyLoading(true);
    try {
      await apiService.verifyIssue(issue._id, verifyComment);
      setHasVerified(true);
      setShowVerifyForm(false);
      toast({ title: '✅ Verified!', description: 'Thanks for confirming this issue.' });
      loadIssue();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Verification failed', variant: 'destructive' });
    } finally { setVerifyLoading(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast({ title: 'Link copied to clipboard' });
  };

  // Lightbox navigation
  const prevImage = () => setLightboxIdx(i => (i !== null && issue ? (i - 1 + issue.images.length) % issue.images.length : null));
  const nextImage = () => setLightboxIdx(i => (i !== null && issue ? (i + 1) % issue.images.length : null));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, issue]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );

  if (!issue) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Issue not found</h1>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </div>
  );

  const images = issue.images?.filter(img => apiService.getImageUrl(img)) || [];
  const reporter = typeof issue.reportedBy === 'object' ? issue.reportedBy : null;
  const statusLabel = STATUS_LABELS[issue.status] || issue.status;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      {/* Lightbox */}
      {lightboxIdx !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="h-8 w-8" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={e => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={apiService.getImageUrl(images[lightboxIdx])}
            alt={`Issue photo ${lightboxIdx + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
            onClick={e => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIdx + 1} / {images.length}
          </p>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" /> Share
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={`text-xs border ${STATUS_COLOR[issue.status] || ''}`}>
                    {statusLabel}
                  </Badge>
                  {issue.severity && (
                    <Badge className={`text-xs ${SEVERITY_COLOR[issue.severity] || ''}`}>
                      {issue.severity} severity
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {CATEGORY_EMOJI[issue.category]} {CATEGORY_LABELS[issue.category] || issue.category}
                  </Badge>
                </div>

                <h1 className="text-xl font-bold text-foreground mb-3">{issue.title}</h1>

                {issue.description && (
                  <p className="text-muted-foreground leading-relaxed text-sm">{issue.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            {images.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Photos ({images.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {images.length === 1 ? (
                    <div
                      className="relative rounded-xl overflow-hidden cursor-zoom-in group"
                      onClick={() => setLightboxIdx(0)}
                    >
                      <img
                        src={apiService.getImageUrl(images[0])}
                        alt="Issue photo"
                        className="w-full max-h-80 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 h-8 w-8 drop-shadow-lg transition-opacity" />
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-2 ${images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {images.slice(0, 4).map((img, idx) => {
                        const src = apiService.getImageUrl(img);
                        const isLast = idx === 3 && images.length > 4;
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden cursor-zoom-in group bg-muted
                              ${idx === 0 && images.length === 3 ? 'col-span-2' : ''}`}
                            style={{ aspectRatio: images.length === 2 ? '16/10' : '4/3' }}
                            onClick={() => setLightboxIdx(idx)}
                          >
                            <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            {isLast && (
                              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-xl">
                                +{images.length - 4}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 drop-shadow transition-opacity" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status timeline */}
            {issue.statusHistory && issue.statusHistory.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Status Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    {issue.statusHistory.map((entry, idx) => (
                      <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                        <div className={`absolute -left-5 mt-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm z-10
                          ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <div className="ml-1">
                          <p className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</p>
                          {entry.remark && <p className="text-xs text-muted-foreground">{entry.remark}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(entry.changedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Community actions */}
            {user && user.role === 'citizen' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Community Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      variant={hasUpvoted ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={handleUpvote}
                      disabled={upvoteLoading}
                    >
                      {upvoteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                      {hasUpvoted ? 'Upvoted' : 'Upvote'} ({issue.upvotes?.length ?? 0})
                    </Button>

                    {!hasVerified && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowVerifyForm(!showVerifyForm)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Verify Issue
                      </Button>
                    )}
                    {hasVerified && (
                      <Button variant="outline" className="flex-1 border-emerald-300 text-emerald-700" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" /> Verified ✓
                      </Button>
                    )}
                  </div>

                  {showVerifyForm && (
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Can you confirm this issue exists?</p>
                      <Textarea
                        placeholder="Optional: add a comment about what you observed…"
                        value={verifyComment}
                        onChange={e => setVerifyComment(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleVerify} disabled={verifyLoading}>
                          {verifyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                          Yes, I confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowVerifyForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Reporter info */}
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Reported by</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {reporter?.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{reporter?.name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{reporter?.email || ''}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2.5 text-sm">
                  {issue.location.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground leading-snug">{issue.location.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {issue.verifiedBy && issue.verifiedBy.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 text-xs font-medium">{issue.verifiedBy.length} community verification{issue.verifiedBy.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {issue.priorityScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Priority score: <span className="font-semibold text-foreground">{issue.priorityScore}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin remarks */}
            {issue.adminRemarks && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Official Update
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{issue.adminRemarks}</p>
                  {issue.assignedDepartment && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Assigned to: <span className="font-medium text-foreground">{issue.assignedDepartment}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Official status updater */}
            {user && (user.role === 'official' || user.role === 'admin') && (
              <OfficialActions issue={issue} onUpdated={loadIssue} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for official actions
const OfficialActions = ({ issue, onUpdated }: { issue: Issue; onUpdated: () => void }) => {
  const { toast } = useToast();
  const [status, setStatus] = useState(issue.status);
  const [remarks, setRemarks] = useState(issue.adminRemarks || '');
  const [dept, setDept] = useState(issue.assignedDepartment || '');
  const [loading, setLoading] = useState(false);

  const update = async () => {
    setLoading(true);
    try {
      await apiService.updateIssueStatus(issue._id, status, remarks, dept);
      toast({ title: '✅ Issue updated' });
      onUpdated();
    } catch (err) {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Official Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['pending','under-review','verified','assigned','work-started','completed','closed','rejected'].map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Department</label>
          <input
            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="e.g. Roads & Infrastructure"
            value={dept} onChange={e => setDept(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Remarks</label>
          <Textarea rows={2} placeholder="Update for the reporter…" value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        <Button size="sm" className="w-full" onClick={update} disabled={loading}>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />} Save Update
        </Button>
      </CardContent>
    </Card>
  );
};

export default IssueDetails;

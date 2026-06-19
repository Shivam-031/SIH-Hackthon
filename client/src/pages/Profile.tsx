import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import {
  User, Mail, Phone, Award, Edit2, Save, X,
  Star, CheckCircle, Clock, Camera, Loader2, Upload
} from 'lucide-react';

const LEVEL_PROGRESS: Record<string, { next: string; threshold: number; color: string }> = {
  Bronze:        { next: 'Silver',      threshold: 200,  color: 'from-amber-600 to-amber-400' },
  Silver:        { next: 'Gold',        threshold: 500,  color: 'from-slate-400 to-slate-300' },
  Gold:          { next: 'Citizen Hero',threshold: 1000, color: 'from-yellow-500 to-yellow-300' },
  'Citizen Hero':{ next: '—',           threshold: 9999, color: 'from-purple-600 to-purple-400' },
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const points = user?.points ?? user?.civicScore ?? 0;
  const level  = user?.level ?? 'Bronze';
  const levelInfo = LEVEL_PROGRESS[level] ?? LEVEL_PROGRESS['Bronze'];
  const progressPct = Math.min(100, Math.round((points / levelInfo.threshold) * 100));

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', editData.name);
      if (editData.phone) fd.append('phone', editData.phone);
      if (avatarFile) fd.append('profileImage', avatarFile);
      await apiService.updateProfile(fd);
      await refreshUser();
      toast({ title: '✅ Profile updated' });
      setIsEditing(false);
      setAvatarFile(null);
      if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({ name: user?.name || '', phone: user?.phone || '' });
    if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
    setAvatarFile(null);
  };

  const BADGES = [
    { name: 'First Report',       desc: 'Reported your first issue',      earned: (user?.badges ?? []).includes('first_report') || points > 0,     icon: Camera },
    { name: 'Verified Reporter',  desc: '10+ verified issues reported',   earned: (user?.badges ?? []).includes('verified_reporter'),               icon: CheckCircle },
    { name: 'Community Helper',   desc: 'Verified 25+ community issues',  earned: (user?.badges ?? []).includes('community_helper'),               icon: Award },
    { name: 'Top Contributor',    desc: 'Top 20 civic score in your area',earned: (user?.badges ?? []).includes('top_contributor'),                 icon: Star },
    { name: 'Quick Responder',    desc: 'Verified issues within 1 hour',  earned: (user?.badges ?? []).includes('quick_responder'),                 icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — avatar + points */}
          <div className="space-y-5">
            {/* Avatar card */}
            <Card className="shadow-sm border-0">
              <CardContent className="pt-6 flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || user?.profileImage?.url || user?.avatar} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                </div>

                <div className="text-center">
                  <p className="font-bold text-lg">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{user?.role}</Badge>
                </div>

                {/* Level + progress */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{level}</span>
                    <span className="text-xs text-muted-foreground">{points} pts</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${levelInfo.color} transition-all duration-500`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {levelInfo.next !== '—' && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {levelInfo.threshold - points} pts to {levelInfo.next}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" /> Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {BADGES.map(b => (
                  <div key={b.name} className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors ${b.earned ? 'bg-primary/5' : 'opacity-40'}`}>
                    <div className={`p-1.5 rounded-lg ${b.earned ? 'bg-primary/10' : 'bg-muted'}`}>
                      <b.icon className={`h-3.5 w-3.5 ${b.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                    </div>
                    {b.earned && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto shrink-0 mt-0.5" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">
            <Tabs defaultValue="info">
              <TabsList className="bg-background border w-full">
                <TabsTrigger value="info" className="flex-1">Personal Info</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Personal Information</CardTitle>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name" value={editData.name}
                          onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center gap-2 py-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{user?.name}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="flex items-center gap-2 py-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user?.email}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">Cannot change</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone" value={editData.phone}
                          placeholder="+91 98765 43210"
                          onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center gap-2 py-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user?.phone || <span className="text-muted-foreground italic">Not set</span>}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Password</p>
                      <p className="text-xs text-muted-foreground mb-3">Change your account password.</p>
                      <Button variant="outline" size="sm" disabled>Change Password (coming soon)</Button>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Account Status</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-emerald-700">Active</span>
                      </div>
                    </div>
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

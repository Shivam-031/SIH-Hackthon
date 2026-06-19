import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
import {
  MapPin, Loader2, Eye, EyeOff, Mail, CheckCircle,
  ShieldCheck, ArrowLeft, RefreshCw, Lock, User as UserIcon,
} from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {[
      { n: 1, label: 'Details' },
      { n: 2, label: 'Verify Email' },
      { n: 3, label: 'Done' },
    ].map(({ n, label }, idx) => (
      <React.Fragment key={n}>
        <div className="flex flex-col items-center gap-1">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${step > n ? 'bg-emerald-500 text-white' : step === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {step > n ? <CheckCircle className="h-4 w-4" /> : n}
          </div>
          <span className={`text-[10px] font-medium ${step === n ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
        </div>
        {idx < 2 && (
          <div className={`h-px w-10 mb-4 transition-colors ${step > n ? 'bg-emerald-500' : 'bg-border'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Google SVG ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
const Register = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 3-step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'citizen', officialCode: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = Array.from({ length: 6 }, () => React.useRef<HTMLInputElement>(null));
  const [countdown, setCountdown] = useState(0);

  // Loading states
  const [sendingOtp, setSendingOtp]     = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registering, setRegistering]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Google Identity Services ─────────────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleGoogleCallback = async (response: { credential: string }) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      toast({ title: '🎉 Welcome to CivicConnect!' });
      navigate('/citizen-dashboard');
    } catch (err) {
      toast({ title: 'Google sign-in failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setGoogleLoading(false); }
  };

  const triggerGoogleSignUp = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      toast({ title: 'Google sign-in not configured', description: 'Set VITE_GOOGLE_CLIENT_ID in your .env', variant: 'destructive' });
      return;
    }
    window.google.accounts.id.prompt();
  };

  // ── Countdown timer for OTP resend ──────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Step 1: send OTP ─────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return;
    }
    if (form.role === 'official' && !form.officialCode) {
      toast({ title: 'Official secret code is required', variant: 'destructive' }); return;
    }

    setSendingOtp(true);
    try {
      await apiService.sendOTP(form.email, form.name);
      setStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
      toast({ title: '📧 Code sent!', description: `Check ${form.email} for a 6-digit code.` });
    } catch (err) {
      toast({ title: 'Failed to send code', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setSendingOtp(false); }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setSendingOtp(true);
    try {
      await apiService.sendOTP(form.email, form.name);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
      toast({ title: 'New code sent!' });
    } catch (err) {
      toast({ title: 'Failed to resend', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setSendingOtp(false); }
  };

  // ── OTP input handlers ────────────────────────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs[5].current?.focus();
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast({ title: 'Enter the full 6-digit code', variant: 'destructive' }); return;
    }

    setVerifyingOtp(true);
    try {
      await apiService.verifyOTP(form.email, code);
      // Immediately register after successful OTP
      await handleRegister();
    } catch (err) {
      toast({ title: 'Incorrect code', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setVerifyingOtp(false); }
  };

  // ── Step 3: register ──────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setRegistering(true);
    try {
      await register(form as any);
      setStep(3);
    } catch (err) {
      toast({ title: 'Registration failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
      setVerifyingOtp(false);
    } finally { setRegistering(false); }
  };

  const goToDashboard = () =>
    navigate(form.role === 'citizen' ? '/citizen-dashboard' : '/official-dashboard');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-5">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary shadow-lg mb-4">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Join CivicConnect</h1>
          <p className="text-sm text-muted-foreground mt-1">Make your community better.</p>
        </div>

        <StepIndicator step={step} />

        {/* ── STEP 1: Account Details ── */}
        {step === 1 && (
          <Card className="shadow-sm border-0">
            <CardContent className="pt-6 space-y-4">

              {/* Google sign-up */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 font-medium gap-3"
                onClick={triggerGoogleSignUp}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign up with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or create with email</span>
                </div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Priya Sharma" className="pl-9" value={form.name} onChange={set('name')} required autoFocus />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={form.email} onChange={set('email')} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                </div>

                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v, officialCode: '' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">🏘️ Citizen — Report &amp; verify issues</SelectItem>
                      <SelectItem value="official">🏛️ Government Official — Manage &amp; resolve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Official secret code — only shown when Official is selected */}
                {form.role === 'official' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="officialCode" className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Government Official Code
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="officialCode"
                        type={showCode ? 'text' : 'password'}
                        placeholder="Enter your department code"
                        className="pl-9 pr-10"
                        value={form.officialCode}
                        onChange={set('officialCode')}
                        required
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCode(v => !v)}>
                        {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contact your department administrator to obtain this code.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                      value={form.password} onChange={set('password')} required className="pr-10"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={sendingOtp}>
                  {sendingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {sendingOtp ? 'Sending code…' : 'Send Verification Code'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="pt-0 flex justify-center text-sm text-muted-foreground">
              Already have an account?&nbsp;
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </CardFooter>
          </Card>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 2 && (
          <Card className="shadow-sm border-0">
            <CardContent className="pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change email
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-3">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Check your inbox</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-foreground">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* 6-digit OTP boxes */}
                <div>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className={`h-12 w-10 rounded-lg border-2 text-center text-xl font-bold bg-background transition-all outline-none
                          ${digit ? 'border-primary text-primary' : 'border-border text-foreground'}
                          focus:border-primary focus:ring-2 focus:ring-primary/20`}
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    The code expires in 10 minutes
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={verifyingOtp || registering || otp.join('').length < 6}>
                  {(verifyingOtp || registering) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {registering ? 'Creating account…' : 'Verifying…'}</>
                  ) : (
                    <><CheckCircle className="mr-2 h-4 w-4" /> Verify & Create Account</>
                  )}
                </Button>

                {/* Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in <span className="font-semibold text-foreground tabular-nums">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={sendingOtp}
                      className="text-sm text-primary hover:underline flex items-center gap-1.5 mx-auto"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                      {sendingOtp ? 'Sending…' : 'Resend code'}
                    </button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <Card className="shadow-sm border-0">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-2">
                <CheckCircle className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">Welcome, {form.name.split(' ')[0]}! 🎉</h2>
                <p className="text-sm text-muted-foreground">
                  Your{form.role === 'official' ? ' government official' : ''} account has been created and your email is verified.
                </p>
              </div>
              <Button className="w-full" onClick={goToDashboard}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Extend Window for Google GSI
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default Register;

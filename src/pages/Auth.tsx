import { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SwipeButton } from '@/components/ui/swipe-button';
import logo from '@/assets/logo.png';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const switchTab = useCallback((tab: 'login' | 'signup') => {
    if (tab === activeTab) return;
    setSlideDirection(tab === 'signup' ? 1 : -1);
    setActiveTab(tab);
  }, [activeTab]);

  // Swipe/drag handler
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activeTab === 'login') {
      switchTab('signup');
    } else if (info.offset.x > threshold && activeTab === 'signup') {
      switchTab('login');
    }
  }, [activeTab, switchTab]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!validateEmail(loginEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    localStorage.setItem('period_tracker_is_new_user', 'false');
    toast({ title: "Login successful!", description: "Welcome back to Flow Index" });
    navigate('/');
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!validateEmail(signupEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure your passwords match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    localStorage.setItem('period_tracker_is_new_user', 'true');
    toast({ title: "Account created!", description: "Please check your email to verify your account." });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Missing email", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    if (!validateEmail(resetEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Check your email", description: "We've sent you a password reset link." });
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-20 h-20 rounded-3xl overflow-hidden shadow-elevated mb-4"
          >
            <img src={logo} alt="Flow Index" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-foreground">Flow Index</h1>
        </motion.div>

        {/* Auth Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="w-full border-border/50 shadow-elevated bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="text-center pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <CardTitle className="text-2xl font-display">
                    {activeTab === 'login' ? 'Welcome back' : 'Get started'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'login' ? 'Sign in to continue' : 'Create your account'}
                  </CardDescription>
                </motion.div>
              </AnimatePresence>
            </CardHeader>

            <CardContent>
              {showForgotPassword ? (
                <motion.form
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </button>

                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="pl-10 border-border/50 focus:border-primary" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gradient-primary text-primary-foreground font-medium h-11" disabled={isLoading}>
                    {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Sparkles className="w-5 h-5" /></motion.div> : 'Send Reset Link'}
                  </Button>
                </motion.form>
              ) : (
                <>
                  {/* Sliding tab switcher with drag hint */}
                  <div className="relative flex bg-muted rounded-lg p-1 mb-6">
                    <motion.div
                      className="absolute top-1 bottom-1 rounded-md bg-card shadow-sm"
                      animate={{ left: activeTab === 'login' ? '4px' : '50%' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ width: 'calc(50% - 4px)' }}
                    />
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className={`relative z-10 flex-1 py-2 text-sm font-medium text-center rounded-md transition-colors ${activeTab === 'login' ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab('signup')}
                      className={`relative z-10 flex-1 py-2 text-sm font-medium text-center rounded-md transition-colors ${activeTab === 'signup' ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Swipe hint */}
                  <p className="text-[10px] text-center text-muted-foreground/60 -mt-4 mb-4">
                    ← Swipe to switch →
                  </p>

                  {/* Swipeable form content */}
                  <motion.div
                    className="relative overflow-hidden touch-pan-y"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.3}
                    onDragEnd={handleDragEnd}
                    style={{ cursor: 'grab' }}
                    whileDrag={{ cursor: 'grabbing' }}
                  >
                    <AnimatePresence mode="wait" custom={slideDirection}>
                      {activeTab === 'login' ? (
                        <motion.form
                          key="login"
                          custom={slideDirection}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          onSubmit={handleLogin}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 border-border/50 focus:border-primary" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10 border-border/50 focus:border-primary" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button type="button" className="text-sm text-primary hover:underline" onClick={() => setShowForgotPassword(true)}>
                              Forgot password?
                            </button>
                          </div>

                          <SwipeButton
                            onConfirm={handleLogin}
                            isLoading={isLoading}
                            text="Swipe to sign in"
                            successText="Welcome back!"
                          />
                          <button type="submit" className="hidden">Sign In</button>
                        </motion.form>
                      ) : (
                        <motion.form
                          key="signup"
                          custom={slideDirection}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          onSubmit={handleSignup}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-name" type="text" placeholder="Jane Doe" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="pl-10 border-border/50 focus:border-primary" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10 border-border/50 focus:border-primary" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10 border-border/50 focus:border-primary" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="signup-confirm" type={showPassword ? 'text' : 'password'} placeholder="Confirm your password" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} className="pl-10 border-border/50 focus:border-primary" />
                            </div>
                          </div>

                          <SwipeButton
                            onConfirm={handleSignup}
                            isLoading={isLoading}
                            text="Swipe to sign up"
                            successText="Welcome!"
                          />
                          <button type="submit" className="hidden">Sign Up</button>

                          <p className="text-xs text-center text-muted-foreground">
                            By signing up, you agree to our{' '}
                            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          </p>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;

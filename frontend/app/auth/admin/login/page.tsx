'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import UniversalLoader from '@/components/ui/universal-loader';

export default function CricketLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      await login(email, password);
        toast.success('Login successful!');
      setEmail('');
      setPassword('');
        router.push('/');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        toast.error(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="theme-page-bg min-h-screen relative overflow-hidden text-foreground">
      <Navbar />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 theme-grid-overlay pointer-events-none" />
        {/* Cricket Ball Animation - Top Right */}
        <motion.div
          animate={{ rotate: 360, x: [0, 50, 0], y: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 right-10 text-7xl opacity-25"
        >
          🏏
        </motion.div>

        {/* Cricket Bat Animation - Bottom Left */}
        <motion.div
          animate={{ rotate: -360, x: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 left-10 text-8xl opacity-20"
        >
          🏏
        </motion.div>

        {/* Stadium Animation - Center Right */}
        <motion.div
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/3 right-1/4 text-6xl opacity-15"
        >
          🏟️
        </motion.div>

        {/* Glowing Green Orb (Cricket Pitch) */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary rounded-full filter blur-3xl opacity-20"
        />
        {/* Glowing Amber Orb (Stadium Lights) */}
        <motion.div
          animate={{ scale: [1.5, 1, 1.5], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-3 rounded-full filter blur-3xl opacity-20"
        />

      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            {/* Animated Emojis */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <motion.div
                animate={{ rotate: [0, 25, -25, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-6xl drop-shadow-lg"
              >
                🏏
              </motion.div>
              <motion.div
                animate={{ y: [0, -15, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-7xl drop-shadow-lg"
              >
                🏟️
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -25, 25, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-6xl drop-shadow-lg"
              >
                🏏
              </motion.div>
            </div>

           
          </motion.div>


        

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleLogin}
            className="theme-card-strong rounded-2xl p-8 shadow-2xl space-y-6"
          >
            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/20 border-2 border-destructive text-destructive-foreground px-4 py-3 rounded-lg flex items-start gap-3"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Login Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-foreground font-bold flex items-center gap-2">
                <Mail size={18} className="text-primary" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@auction.com"
                className="w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all duration-300"
                required
                disabled={localLoading || isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-foreground font-bold flex items-center gap-2">
                <Lock size={18} className="text-chart-3" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all duration-300 pr-12"
                  required
                  disabled={localLoading || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  disabled={localLoading || isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                disabled={localLoading || isLoading}
              />
              <label
                htmlFor="remember"
                className="text-foreground text-sm font-medium cursor-pointer hover:text-primary transition-colors"
              >
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: localLoading || isLoading ? 1 : 1.02 }}
              whileTap={{ scale: localLoading || isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={localLoading || isLoading}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {localLoading || isLoading ? (
                <UniversalLoader size="sm" hideText className="h-5 w-5" />
              ) : (
                <>
                  <LogIn size={20} />
                  Enter the Arena
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Cricket Admin Only</span>
              </div>
            </div>

            {/* Support Link */}
            {/* <p className="text-center text-foreground/80 text-sm">
              Don't have access?{' '}
              <a href="mailto:support@auction.com" className="text-primary hover:text-primary/90 font-semibold transition-colors">
                Contact Support
              </a>
            </p> */}
          </motion.form>

          {/* Bottom Cricket Animation */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-center mt-10"
          >
            <p className="text-primary text-sm font-semibold mb-3">🏏 May the best bid win! 🏏</p>
            <div className="flex justify-center gap-4 text-4xl">
              <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                🏏
              </motion.span>
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                🎯
              </motion.span>
              <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                🏏
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Cricket Elements - Background */}
      <motion.div
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-20 text-9xl opacity-20 pointer-events-none"
      >
        🏏
      </motion.div>
      <motion.div
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute bottom-32 left-20 text-10xl opacity-15 pointer-events-none"
      >
        🏟️
      </motion.div>
    </div>
  );
}

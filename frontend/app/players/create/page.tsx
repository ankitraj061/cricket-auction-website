'use client';

import React, { useEffect, useState } from 'react';
import axiosClient from '@/app/client/axiosClient';
import { toast } from 'sonner';
import { UserPlus, Trophy, IndianRupee, Phone, FileText, BarChart3, ImageIcon, Sparkles, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuctionSettings } from '@/app/types/type';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { uiTokens } from '@/lib/uiTokens';

const roles = [
  { label: 'Batsman', value: 'BATSMAN' },
  { label: 'Bowler', value: 'BOWLER' },
  { label: 'Allrounder', value: 'ALLROUNDER' },
];

const CreatePlayer = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('BATSMAN');
  const [basePrice, setBasePrice] = useState('');
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');
  const [stats, setStats] = useState('');
  const [playerImageUrl, setPlayerImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [basePriceOptions, setBasePriceOptions] = useState<number[]>([2000, 3000, 5000]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axiosClient.get<AuctionSettings>('/api/auction/settings');
        const prices = response.data.allowedBasePrices?.length
          ? [...response.data.allowedBasePrices].sort((a, b) => a - b)
          : [2000, 3000, 5000];
        setBasePriceOptions(prices);
        setBasePrice((prev) => (prev && prices.includes(Number(prev)) ? prev : String(prices[0])));
      } catch {
        setBasePriceOptions([2000, 3000, 5000]);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !basePrice) {
      toast.error('Name, role and base price are required');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/api/auction/players', {
        name,
        role,
        basePrice: Number(basePrice),
        mobile,
        description,
        stats,
        playerImageUrl,
      });
      toast.success('Player created successfully!');
      setName('');
      setRole('BATSMAN');
      setBasePrice(String(basePriceOptions[0] || ''));
      setMobile('');
      setDescription('');
      setStats('');
      setPlayerImageUrl('');
    } catch {
      toast.error('Failed to create player');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-input border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all duration-300";
  const labelClasses = "block text-sm font-semibold text-foreground mb-2 flex items-center gap-2";

  return (
    <div className="theme-page-bg min-h-screen p-6 relative overflow-hidden text-foreground">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="theme-grid-overlay absolute inset-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto mb-4 flex justify-end">
        <Link href="/">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <div className="relative group">
              <Button className={uiTokens.backHomeButton}>
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </div>
          </motion.div>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto relative z-10"
      >
        <div className="theme-card-strong relative rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative bg-secondary/60 p-6 border-b border-border">
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-primary/15 rounded-2xl border border-border">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="theme-title-gradient text-3xl font-black">
                  Create New Player
                </h2>
                <p className="theme-muted text-sm mt-1">Add a player to the auction pool</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="name" className={labelClasses}>
                <Trophy className="h-4 w-4 text-primary" />
                Player Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className={inputClasses}
                placeholder="Enter player's full name"
              />
            </motion.div>

            {/* Role and Base Price - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="role" className={labelClasses}>
                  <Sparkles className="h-4 w-4 text-chart-2" />
                  Role *
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                  className={inputClasses}
                >
                  {roles.map(r => (
                    <option key={r.value} value={r.value} className="bg-input">
                      {r.label}
                    </option>
                  ))}
                </select>
              </motion.div>

              {/* Base Price Field */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="basePrice" className={labelClasses}>
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Base Price *
                </label>
                <select
                  id="basePrice"
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  required
                  className={inputClasses}
                >
                  <option value="" className="bg-input">Select base price</option>
                  {basePriceOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-input">
                      ₹{opt}
                    </option>
                  ))}
                </select>
              </motion.div>
            </div>

            {/* Mobile Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="mobile" className={labelClasses}>
                <Phone className="h-4 w-4 text-accent" />
                Mobile Number
              </label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="Optional mobile number"
                className={inputClasses}
              />
            </motion.div>

            {/* Image URL Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="playerImageUrl" className={labelClasses}>
                <ImageIcon className="h-4 w-4 text-chart-3" />
                Player Image URL
              </label>
              <input
                id="playerImageUrl"
                type="url"
                value={playerImageUrl}
                onChange={e => setPlayerImageUrl(e.target.value)}
                placeholder="https://example.com/player-image.jpg"
                className={inputClasses}
              />
            </motion.div>

            {/* Description Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="description" className={labelClasses}>
                <FileText className="h-4 w-4 text-chart-2" />
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputClasses} resize-none`}
                placeholder="Brief description about the player"
                rows={3}
              />
            </motion.div>

            {/* Stats Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="stats" className={labelClasses}>
                <BarChart3 className="h-4 w-4 text-primary" />
                Performance Stats
              </label>
              <textarea
                id="stats"
                value={stats}
                onChange={e => setStats(e.target.value)}
                className={`${inputClasses} resize-none`}
                placeholder="Player statistics and achievements"
                rows={3}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full"
            >
              <div className={`${uiTokens.adminPrimaryButton} w-full rounded-2xl py-4 px-6 transition-all duration-300 flex items-center justify-center gap-2 ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Player...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Player</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>

          <div className="h-1 bg-border"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePlayer;

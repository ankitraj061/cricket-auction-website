'use client';

import React, { useState } from 'react';
import axiosClient from '@/app/client/axiosClient';
import { toast } from 'sonner';
import { Users, Trophy, ImageIcon, User, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { uiTokens } from '@/lib/uiTokens';

const CreateTeam = () => {
  const [name, setName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainImage, setCaptainImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !captainName) {
      toast.error('Team name and captain name are required');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/api/auction/teams', {
        name,
        captainName,
        captainImage,
      });
      toast.success('Team created successfully!');
      setName('');
      setCaptainName('');
      setCaptainImage('');
    } catch {
      toast.error('Failed to create team');
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
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="theme-title-gradient text-3xl font-black">
                  Create New Team
                </h2>
                <p className="theme-muted text-sm mt-1">Add a team to the auction</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Team Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="name" className={labelClasses}>
                <Trophy className="h-4 w-4 text-primary" />
                Team Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className={inputClasses}
                placeholder="Enter team name"
              />
            </motion.div>

            {/* Captain Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="captainName" className={labelClasses}>
                <User className="h-4 w-4 text-chart-2" />
                Captain Name *
              </label>
              <input
                id="captainName"
                type="text"
                value={captainName}
                onChange={e => setCaptainName(e.target.value)}
                required
                className={inputClasses}
                placeholder="Enter captain's name"
              />
            </motion.div>

            {/* Team Logo Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="captainImage" className={labelClasses}>
                <ImageIcon className="h-4 w-4 text-primary" />
                Team Logo
              </label>
              <input
                id="captainImage"
                type="url"
                value={captainImage}
                onChange={e => setCaptainImage(e.target.value)}
                placeholder="https://example.com/team-logo.png"
                className={inputClasses}
              />
              <p className="text-xs text-muted-foreground mt-2 ml-1">Optional: Provide a URL to the team logo image</p>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full"
            >
              <div className={`${uiTokens.adminPrimaryButton} w-full rounded-2xl py-4 px-6 transition-all duration-300 flex items-center justify-center gap-2 ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Team...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    <span>Create Team</span>
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

export default CreateTeam;

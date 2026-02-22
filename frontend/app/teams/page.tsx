'use client';

import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import TeamCard from '@/components/TeamCard';
import { Button } from '@/components/ui/button';
import { Home, Users, Sparkles, Trophy, Plus } from 'lucide-react';
import Link from 'next/link';
import axiosClient from '../client/axiosClient';
import { Team } from '@/app/types/type';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uiTokens } from '@/lib/uiTokens';

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamDialogMode, setTeamDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    captainName: '',
    captainImage: '',
  });
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const getErrorMessage = (error: unknown, fallback: string): string => {
    const axiosError = error as AxiosError<{ error?: string }>;
    return axiosError.response?.data?.error || fallback;
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const teamsResponse = await axiosClient.get<Team[]>('/api/auction/teams');
      setTeams(teamsResponse.data);
    } catch (error) {
      console.error('Failed to fetch teams', error);
      toast.error('Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsOnly = async () => {
    try {
      const teamsResponse = await axiosClient.get<Team[]>('/api/auction/teams');
      setTeams(teamsResponse.data);
    } catch {
      toast.error('Failed to refresh teams list');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreateTeamDialog = () => {
    setTeamDialogMode('create');
    setSelectedTeam(null);
    setTeamForm({ name: '', captainName: '', captainImage: '' });
    setTeamDialogOpen(true);
  };

  const openEditTeamDialog = (team: Team) => {
    setTeamDialogMode('edit');
    setSelectedTeam(team);
    setTeamForm({
      name: team.name || '',
      captainName: team.captainName || '',
      captainImage: team.captainImage || '',
    });
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }
    if (!teamForm.name.trim() || !teamForm.captainName.trim()) {
      toast.error('Team name and captain name are required');
      return;
    }

    setTeamSubmitting(true);
    try {
      if (teamDialogMode === 'create') {
        await axiosClient.post('/api/auction/teams', {
          ...teamForm,
          name: teamForm.name.trim(),
          captainName: teamForm.captainName.trim(),
        });
        toast.success('Team created successfully');
      } else if (selectedTeam?.id) {
        await axiosClient.put(`/api/auction/teams/${selectedTeam.id}`, {
          ...teamForm,
          name: teamForm.name.trim(),
          captainName: teamForm.captainName.trim(),
        });
        toast.success('Team updated successfully');
      }

      setTeamDialogOpen(false);
      await fetchTeamsOnly();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save team'));
    } finally {
      setTeamSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }
    setTeamToDelete(team);
    setDeleteConfirmName('');
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete?.id) {
      toast.error('No team selected');
      return;
    }
    if (deleteConfirmName.trim() !== teamToDelete.name) {
      toast.error('Team name does not match');
      return;
    }

    setDeleteSubmitting(true);
    try {
      await axiosClient.delete(`/api/auction/teams/${teamToDelete.id}`);
      toast.success('Team deleted successfully');
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      setDeleteConfirmName('');
      await fetchTeamsOnly();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete team'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="theme-page-bg min-h-screen text-foreground relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-3/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="theme-grid-overlay absolute inset-0 pointer-events-none"></div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-primary/10 rounded-full border border-border">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary text-xs font-semibold tracking-wide uppercase">
                Team Management
              </span>
            </div>
            <h1 className="theme-title-gradient text-4xl md:text-5xl font-black tracking-tight">
              All Teams
            </h1>
            <p className="theme-muted mt-2 text-sm md:text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-chart-3" />
              View team details, squad composition, and remaining purse
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                onClick={openCreateTeamDialog}
                className={`${uiTokens.adminPrimaryButton} px-6 py-6 text-base`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Team
              </Button>
            )}
            {isAdmin && (
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
            )}
            {!isAdmin && (
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
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="theme-card relative overflow-hidden rounded-2xl h-64"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/30 to-transparent animate-shimmer" />
                </motion.div>
              ))}
            </motion.div>
          ) : teams.length > 0 ? (
            <motion.div
              key="teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  <TeamCard
                    team={team}
                    initialPurse={100000}
                    isAdmin={isAdmin}
                    onEdit={openEditTeamDialog}
                    onDelete={handleDeleteTeam}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="theme-card-strong relative rounded-3xl p-20 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="inline-flex items-center justify-center p-8 bg-primary/15 rounded-full mb-6 border-2 border-border shadow-xl"
                >
                  <Users className="h-16 w-16 text-primary" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-black text-foreground mb-3"
                >
                  No Teams Yet
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="theme-muted max-w-md mx-auto mb-8 leading-relaxed text-lg"
                >
                  Teams will appear here once they are created. Start building your dream squads for the auction!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {isAdmin ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <button
                        type="button"
                        onClick={openCreateTeamDialog}
                        className={`${uiTokens.adminPrimaryButton} inline-flex items-center gap-3 px-8 py-4 rounded-xl`}
                      >
                        <Users className="h-5 w-5" />
                        Create Your First Team
                        <Sparkles className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ) : (
                    <Link href="/auth/admin/login">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <div className={`${uiTokens.adminPrimaryButton} inline-flex items-center gap-3 px-8 py-4 rounded-xl`}>
                          <Users className="h-5 w-5" />
                          Admin Login to Create Team
                          <Sparkles className="h-5 w-5" />
                        </div>
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>{teamDialogMode === 'create' ? 'Create Team' : 'Edit Team'}</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              {teamDialogMode === 'create'
                ? 'Add a new team for this season.'
                : `Update details for ${selectedTeam?.name || 'this team'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={teamForm.name}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                className={uiTokens.formInput}
              />
            </div>
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="captainName">Captain Name</Label>
              <Input
                id="captainName"
                value={teamForm.captainName}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, captainName: e.target.value }))}
                placeholder="Enter captain name"
                className={uiTokens.formInput}
              />
            </div>
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="captainImage">Captain Image URL</Label>
              <Input
                id="captainImage"
                value={teamForm.captainImage}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, captainImage: e.target.value }))}
                placeholder="https://..."
                className={uiTokens.formInput}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={teamSubmitting}>
              {teamSubmitting ? 'Saving...' : teamDialogMode === 'create' ? 'Create Team' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Delete Team</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Type <span className="font-bold text-destructive">{teamToDelete?.name}</span> to confirm deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label className={uiTokens.formLabel} htmlFor="deleteTeamName">Team Name</Label>
            <Input
              id="deleteTeamName"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Enter team name exactly"
              className={uiTokens.formInput}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setTeamToDelete(null);
                setDeleteConfirmName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTeam}
              disabled={deleteSubmitting || !teamToDelete || deleteConfirmName.trim() !== teamToDelete.name}
            >
              {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Teams;

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Gavel,
  Settings,
  Shield,
  Trophy,
  UserPlus,
  UserSearch,
  Users,
  UsersRound,
  CircleDollarSign,
  Target,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useAuth } from './contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import RetainedPlayers from '@/components/RetainedPlayers';
import { CricketTournamentTimeline } from '@/components/CricketTimeLine';
import axiosClient from './client/axiosClient';
import { AuctionSettings } from './types/type';
import { toast } from 'sonner';
import { uiTokens } from '@/lib/uiTokens';

const getAllowedBasePricesText = (value: unknown) => {
  if (!Array.isArray(value)) return '2000,3000,5000';
  const cleaned = value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
  return cleaned.length ? cleaned.join(',') : '2000,3000,5000';
};

const HomePage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [auctionSettings, setAuctionSettings] = useState<AuctionSettings | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    seasonName: 'Season 1',
    initialPurse: 100000,
    minPlayersPerTeam: 0,
    maxPlayersPerTeam: 11,
    playerOrderByBasePrice: 'DESC' as 'ASC' | 'DESC' | 'NONE',
    playerOrderByRole: 'NO_ORDER' as 'NO_ORDER' | 'BATSMAN_FIRST' | 'BOWLER_FIRST' | 'ALLROUNDER_FIRST',
    allowedBasePricesText: '2000,3000,5000',
    isExchangeAllowed: false,
    applyToExistingTeams: false,
  });
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axiosClient.get<AuctionSettings>('/api/auction/settings');
        setAuctionSettings(response.data);
        setSettingsForm({
          seasonName: response.data.seasonName,
          initialPurse: response.data.initialPurse,
          minPlayersPerTeam: response.data.minPlayersPerTeam,
          maxPlayersPerTeam: response.data.maxPlayersPerTeam,
          playerOrderByBasePrice: response.data.playerOrderByBasePrice,
          playerOrderByRole: response.data.playerOrderByRole,
          allowedBasePricesText: getAllowedBasePricesText(response.data.allowedBasePrices),
          isExchangeAllowed: Boolean(response.data.isExchangeAllowed),
          applyToExistingTeams: false,
        });
      } catch {
        setAuctionSettings(null);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (!settingsDialogOpen || !auctionSettings) return;

    setSettingsForm({
      seasonName: auctionSettings.seasonName,
      initialPurse: auctionSettings.initialPurse,
      minPlayersPerTeam: auctionSettings.minPlayersPerTeam,
      maxPlayersPerTeam: auctionSettings.maxPlayersPerTeam,
      playerOrderByBasePrice: auctionSettings.playerOrderByBasePrice,
      playerOrderByRole: auctionSettings.playerOrderByRole,
      allowedBasePricesText: getAllowedBasePricesText(auctionSettings.allowedBasePrices),
      isExchangeAllowed: Boolean(auctionSettings.isExchangeAllowed),
      applyToExistingTeams: false,
    });
  }, [settingsDialogOpen, auctionSettings]);

  const auctionOrderLabel = useMemo(() => {
    if (!auctionSettings) return null;

    const baseLabel =
      auctionSettings.playerOrderByBasePrice === 'ASC'
        ? 'Base: Asc'
        : auctionSettings.playerOrderByBasePrice === 'DESC'
          ? 'Base: Desc'
          : 'Base: No Order';

    const roleLabel =
      auctionSettings.playerOrderByRole === 'BATSMAN_FIRST'
        ? 'Role: Batsman First'
        : auctionSettings.playerOrderByRole === 'BOWLER_FIRST'
          ? 'Role: Bowler First'
          : auctionSettings.playerOrderByRole === 'ALLROUNDER_FIRST'
            ? 'Role: All-Rounder First'
            : 'Role: No Order';

    return `${baseLabel} | ${roleLabel}`;
  }, [auctionSettings]);

  const menuItems = [
    {
      title: 'Players',
      description: 'Scout profiles, compare skill roles, and shortlist your match-winners.',
      icon: UserSearch,
      link: '/players',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
    {
      title: 'Teams',
      description: 'Track squad balance, role depth, and remaining purse in real time.',
      icon: Users,
      link: '/teams',
      iconBg: 'bg-chart-3/20',
      iconColor: 'text-chart-3',
    },
    {
      title: 'Auction',
      description: 'Control live bidding with fast decisions, clean flow, and complete focus.',
      icon: Gavel,
      link: '/auction',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
    },
  ];

  const quickActions = [
    {
      label: 'Add Player',
      icon: UserPlus,
      link: '/players/create',
      buttonClass: uiTokens.adminPrimaryButton,
    },
    {
      label: 'Add Team',
      icon: UsersRound,
      link: '/team/create',
      buttonClass: uiTokens.adminSecondaryButton,
    },
  ];

  const heroStats = [
    { label: 'Live Bids', value: 'Real-Time', icon: CircleDollarSign },
    { label: 'Team Strategy', value: 'Role-Based', icon: Target },
    { label: 'Auction Format', value: 'Pro Control', icon: Shield },
  ];

  const visibleItems = menuItems.filter((item) => {
    if (item.title === 'Auction') return isAuthenticated && !isLoading;
    return true;
  });

  const handleUpdateSettings = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }

    if (!settingsForm.seasonName.trim()) {
      toast.error('Season name is required');
      return;
    }
    if (settingsForm.initialPurse <= 0) {
      toast.error('Initial purse must be positive');
      return;
    }
    if (settingsForm.minPlayersPerTeam < 0 || settingsForm.maxPlayersPerTeam <= 0) {
      toast.error('Player limits are invalid');
      return;
    }
    if (settingsForm.minPlayersPerTeam > settingsForm.maxPlayersPerTeam) {
      toast.error('Min players cannot be greater than max players');
      return;
    }
    const normalizedAllowedBasePrices = Array.from(
      new Set(
        settingsForm.allowedBasePricesText
          .split(',')
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    ).sort((a, b) => a - b);
    if (normalizedAllowedBasePrices.length === 0) {
      toast.error('Add at least one valid base price');
      return;
    }

    setSettingsSubmitting(true);
    try {
      const response = await axiosClient.put('/api/auction/settings', {
        ...settingsForm,
        allowedBasePrices: normalizedAllowedBasePrices,
      });
      setAuctionSettings(response.data.settings);
      toast.success(response.data.message || 'Auction settings updated');
      setSettingsDialogOpen(false);
      setSettingsForm((prev) => ({ ...prev, applyToExistingTeams: false }));
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message || 'Failed to update settings');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  return (
    <>
      <div className="theme-page-bg relative min-h-screen overflow-hidden">
        <Navbar />

        <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-14">
          <section className="max-w-7xl mx-auto pt-8 sm:pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-10 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65 }}
                className="relative overflow-hidden rounded-3xl border border-border stadium-glow"
              >
                <div className="absolute inset-0">
                  <Image
                    src="/hero-cricket-auction.jpg"
                    alt="Cricket auction stadium"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/92 via-background/75 to-background/45"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                </div>

                <div className="relative p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-between pitch-lines">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1.5 text-xs tracking-[0.14em] uppercase text-foreground">
                      <Trophy className="h-3.5 w-3.5" />
                      Cricket Auction Hub
                    </div>

                    <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl leading-[0.92] text-foreground">
                      Build The
                      <span className="block text-shine">Champion XI</span>
                    </h1>

                    <p className="mt-4 max-w-xl text-base sm:text-lg text-foreground/90 font-medium">
                      A focused control room for cricket auctions. Manage budgets, outbid rivals, and shape balanced squads without losing speed.
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {heroStats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur"
                        >
                          <div className="flex items-center gap-2 text-foreground/80 text-xs uppercase tracking-[0.14em]">
                            <Icon className="h-4 w-4 text-primary" />
                            {item.label}
                          </div>
                          <p className="text-lg text-foreground mt-1 font-semibold">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="rounded-3xl border border-border bg-card/90 p-6 sm:p-8 stadium-glow"
              >
                <h2 className="text-3xl sm:text-4xl text-foreground">Command Deck</h2>
                <p className="text-muted-foreground mt-2 mb-6">
                  Start quickly with high-impact actions before the next lot opens.
                </p>

                {isAuthenticated && !isLoading ? (
                  <div className="space-y-3">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link key={action.label} href={action.link} className="block">
                          <motion.div className="w-full" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                            <div className={`w-full rounded-xl px-5 py-3.5 font-bold flex items-center justify-between transition-all duration-200 ${action.buttonClass}`}>
                              <div className="flex items-center gap-2.5">
                                <Icon className="h-5 w-5" />
                                <span className="text-lg">{action.label}</span>
                              </div>
                              <ArrowRight className="h-5 w-5" />
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })}

                    {isAdmin && (
                      <motion.div className="w-full" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                        <button
                          type="button"
                          onClick={() => setSettingsDialogOpen(true)}
                          className={`w-full rounded-xl px-5 py-3.5 font-bold flex items-center justify-between transition-all duration-200 ${uiTokens.adminSecondaryButton}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Settings className="h-5 w-5" />
                            <span className="text-lg">Auction Settings</span>
                          </div>
                          <ArrowRight className="h-5 w-5" />
                        </button>
                      </motion.div>
                    )}

                    <div className="rounded-xl border border-border bg-primary/10 p-4 text-foreground">
                      <p className="text-sm uppercase tracking-[0.12em] text-muted-foreground">Pro Tip</p>
                      <p className="text-base mt-1">Open the auction room only when squads and purse values are verified.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary/70 p-5">
                    <p className="text-foreground text-lg">Sign in as admin to unlock auction controls and team operations.</p>
                    <Link href="/auth/admin/login" className={`inline-flex items-center gap-2 mt-4 rounded-lg px-4 py-2 ${uiTokens.adminPrimaryButton}`}>
                      <Shield className="h-4 w-4" />
                      Admin Access
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto mt-10">
            <div className={`grid ${visibleItems.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'} gap-5`}>
              {visibleItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.14, duration: 0.5 }}
                  >
                    <Link href={item.link}>
                      <Card className="group relative overflow-hidden rounded-2xl theme-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border stadium-glow">
                        <div className="relative z-10">
                          <div className={`w-12 h-12 rounded-xl ${item.iconBg} border border-border/60 flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${item.iconColor}`} />
                          </div>

                          <h3 className="mt-5 text-3xl text-foreground">{item.title}</h3>
                          <p className="mt-2 text-base text-foreground/80 min-h-16">{item.description}</p>
                          {item.title === 'Auction' && auctionOrderLabel && (
                            <p className="mt-2 text-xs font-semibold text-primary/95">{auctionOrderLabel}</p>
                          )}

                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-foreground transition-colors">
                            Explore Module
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      <div className="relative z-30 bg-card border-t border-border">
        <RetainedPlayers />
        <CricketTournamentTimeline />

        <footer className="border-t border-border py-8 px-2 text-center bg-card">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Cricket Auction Platform • Made by Ankit</p>
        </footer>
      </div>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Auction Settings</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Manage season, team limits, purse, and player order algorithm.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="seasonName">Season Name</Label>
              <Input
                id="seasonName"
                value={settingsForm.seasonName}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, seasonName: e.target.value }))}
                className={uiTokens.formInput}
              />
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="initialPurse">Initial Purse Per Team</Label>
              <Input
                id="initialPurse"
                type="number"
                min={1}
                value={settingsForm.initialPurse}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, initialPurse: Number(e.target.value) || 0 }))
                }
                className={uiTokens.formInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="minPlayers">Min Players / Team</Label>
                <Input
                  id="minPlayers"
                  type="number"
                  min={0}
                  value={settingsForm.minPlayersPerTeam}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, minPlayersPerTeam: Number(e.target.value) || 0 }))
                  }
                  className={uiTokens.formInput}
                />
              </div>
              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="maxPlayers">Max Players / Team</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={1}
                  value={settingsForm.maxPlayersPerTeam}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, maxPlayersPerTeam: Number(e.target.value) || 0 }))
                  }
                  className={uiTokens.formInput}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="baseOrder">Base Price Order</Label>
                <select
                  id="baseOrder"
                  value={settingsForm.playerOrderByBasePrice}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      playerOrderByBasePrice: e.target.value as 'ASC' | 'DESC' | 'NONE',
                    }))
                  }
                  className={uiTokens.formInput}
                >
                  <option value="DESC">Descending (High to Low)</option>
                  <option value="ASC">Ascending (Low to High)</option>
                  <option value="NONE">No Order</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="roleOrder">Role Priority</Label>
                <select
                  id="roleOrder"
                  value={settingsForm.playerOrderByRole}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      playerOrderByRole: e.target.value as
                        | 'NO_ORDER'
                        | 'BATSMAN_FIRST'
                        | 'BOWLER_FIRST'
                        | 'ALLROUNDER_FIRST',
                    }))
                  }
                  className={uiTokens.formInput}
                >
                  <option value="NO_ORDER">No Order</option>
                  <option value="BATSMAN_FIRST">Batsman First</option>
                  <option value="BOWLER_FIRST">Bowler First</option>
                  <option value="ALLROUNDER_FIRST">All-Rounder First</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="allowedBasePrices">Allowed Base Prices</Label>
              <Input
                id="allowedBasePrices"
                value={settingsForm.allowedBasePricesText}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, allowedBasePricesText: e.target.value }))
                }
                placeholder="Example: 2000,4000,5000"
                className={uiTokens.formInput}
              />
              <p className="text-xs text-muted-foreground">Comma separated values. Only these will appear while adding players.</p>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={settingsForm.isExchangeAllowed}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, isExchangeAllowed: e.target.checked }))
                }
              />
              Enable player exchange (trade/swap) between teams
            </label>

            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={settingsForm.applyToExistingTeams}
                onChange={(e) =>
                  setSettingsForm((prev) => ({ ...prev, applyToExistingTeams: e.target.checked }))
                }
              />
              Apply new purse to all existing teams
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} disabled={settingsSubmitting}>
              {settingsSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomePage;

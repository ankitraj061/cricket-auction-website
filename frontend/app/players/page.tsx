'use client';

import { useState, useEffect, useMemo } from 'react';
import { AxiosError } from 'axios';
import PlayerCard from '@/components/PlayerCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Home, Filter, X, Sparkles, TrendingUp, Plus, RotateCcw, Repeat } from 'lucide-react';
import Link from 'next/link';
import axiosClient from '../client/axiosClient';
import { AuctionSettings, Player, Team } from '@/app/types/type';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { uiTokens } from '@/lib/uiTokens';

type PlayerFormState = {
  name: string;
  role: 'BATSMAN' | 'BOWLER' | 'ALLROUNDER';
  basePrice: number;
  mobile: string;
  description: string;
  stats: string;
  playerImageUrl: string;
};

const defaultPlayerForm: PlayerFormState = {
  name: '',
  role: 'BATSMAN',
  basePrice: 2000,
  mobile: '',
  description: '',
  stats: '',
  playerImageUrl: '',
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as AxiosError<{ error?: string }>;
  return axiosError.response?.data?.error || fallback;
};

type PlayersApiResponse =
  | Player[]
  | {
      players: Player[];
      teams?: Team[];
    };

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allowedBasePrices, setAllowedBasePrices] = useState<number[]>([2000, 3000, 5000]);
  const [isExchangeAllowed, setIsExchangeAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sold' | 'unsold'>('all');
  const [priceFilter, setPriceFilter] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'BATSMAN' | 'BOWLER' | 'ALLROUNDER'>('all');

  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [playerDialogMode, setPlayerDialogMode] = useState<'create' | 'edit'>('create');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [playerForm, setPlayerForm] = useState<PlayerFormState>(defaultPlayerForm);
  const [playerSubmitting, setPlayerSubmitting] = useState(false);

  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [salePlayer, setSalePlayer] = useState<Player | null>(null);
  const [saleTeamId, setSaleTeamId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [deletePlayerDialogOpen, setDeletePlayerDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [deletePlayerSubmitting, setDeletePlayerSubmitting] = useState(false);
  const [unsoldPlayerDialogOpen, setUnsoldPlayerDialogOpen] = useState(false);
  const [playerToMarkUnsold, setPlayerToMarkUnsold] = useState<Player | null>(null);
  const [markUnsoldSubmitting, setMarkUnsoldSubmitting] = useState(false);
  const [bulkUnsoldDialogOpen, setBulkUnsoldDialogOpen] = useState(false);
  const [bulkUnsoldConfirmText, setBulkUnsoldConfirmText] = useState('');
  const [bulkUnsoldSubmitting, setBulkUnsoldSubmitting] = useState(false);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeIncomingPlayerId, setExchangeIncomingPlayerId] = useState('');
  const [exchangeRequestedTeamId, setExchangeRequestedTeamId] = useState('');
  const [exchangeOutgoingPlayerId, setExchangeOutgoingPlayerId] = useState('');
  const [exchangeCash, setExchangeCash] = useState('0');
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [playersResponse, settingsResponse] = await Promise.all([
        axiosClient.get<PlayersApiResponse>('/api/auction/players'),
        axiosClient.get<AuctionSettings>('/api/auction/settings'),
      ]);
      if (Array.isArray(playersResponse.data)) {
        setPlayers(playersResponse.data.filter(Boolean));
        const mappedTeams = playersResponse.data
          .filter((player): player is Player => Boolean(player) && Boolean(player.team))
          .map((player) => ({
            id: player.team!.id,
            name: player.team!.name,
            captainName: '',
            captainImage: null,
            currentPurse: 0,
            remainingPurse: 0,
            totalPlayers: 0,
          }));
        const uniqueTeams = Array.from(new Map(mappedTeams.map((team) => [team.id, team])).values());
        setTeams(uniqueTeams);
      } else {
        setPlayers((playersResponse.data.players || []).filter(Boolean));
        setTeams(playersResponse.data.teams || []);
      }
      const allowedPrices = settingsResponse.data.allowedBasePrices?.length
        ? [...settingsResponse.data.allowedBasePrices].sort((a, b) => a - b)
        : [2000, 3000, 5000];
      setAllowedBasePrices(allowedPrices);
      setIsExchangeAllowed(Boolean(settingsResponse.data.isExchangeAllowed));
      setPlayerForm((prev) => ({
        ...prev,
        basePrice: allowedPrices.includes(prev.basePrice) ? prev.basePrice : allowedPrices[0],
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
      setPlayers([]);
      setTeams([]);
      setAllowedBasePrices([2000, 3000, 5000]);
      setIsExchangeAllowed(false);
      toast.error('Failed to load players data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const soldPlayers = useMemo(
    () => players.filter((player): player is Player => Boolean(player) && player.isSold && player.teamId != null),
    [players]
  );

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.role.toLowerCase().includes(searchQuery.toLowerCase());

      const isSold = player.isSold && player.soldPrice != null;
      let matchesStatus = true;
      if (statusFilter === 'sold') matchesStatus = isSold;
      if (statusFilter === 'unsold') matchesStatus = !isSold;

      let matchesPrice = true;
      if (priceFilter !== 'all') {
        matchesPrice = player.basePrice === priceFilter;
      }

      let matchesRole = true;
      if (roleFilter !== 'all') {
        matchesRole = player.role === roleFilter;
      }

      return matchesSearch && matchesStatus && matchesPrice && matchesRole;
    });
  }, [players, searchQuery, statusFilter, priceFilter, roleFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriceFilter('all');
    setRoleFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || priceFilter !== 'all' || roleFilter !== 'all' || !!searchQuery;

  const selectedIncomingPlayer = useMemo(
    () => soldPlayers.find((player) => player.id === Number(exchangeIncomingPlayerId)),
    [soldPlayers, exchangeIncomingPlayerId]
  );

  const availableRequestedTeams = useMemo(() => {
    if (!selectedIncomingPlayer?.teamId) return teams;
    return teams.filter((team) => team.id !== selectedIncomingPlayer.teamId);
  }, [teams, selectedIncomingPlayer]);

  const outgoingPlayerOptions = useMemo(() => {
    if (!exchangeRequestedTeamId) return [];
    return soldPlayers.filter((player) => player.teamId === Number(exchangeRequestedTeamId));
  }, [soldPlayers, exchangeRequestedTeamId]);

  const applyTeamRefund = (teamId: number | null | undefined, amount: number | null | undefined) => {
    if (!teamId || !amount) return;
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              currentPurse: team.currentPurse + amount,
              remainingPurse: team.remainingPurse + amount,
              totalPlayers: Math.max(0, team.totalPlayers - 1),
            }
          : team
      )
    );
  };

  const openCreateDialog = () => {
    setPlayerDialogMode('create');
    setEditingPlayer(null);
    setPlayerForm({
      ...defaultPlayerForm,
      basePrice: allowedBasePrices[0] || 2000,
    });
    setPlayerDialogOpen(true);
  };

  const openEditDialog = (player: Player) => {
    setPlayerDialogMode('edit');
    setEditingPlayer(player);
    setPlayerForm({
      name: player.name,
      role: player.role as 'BATSMAN' | 'BOWLER' | 'ALLROUNDER',
      basePrice: player.basePrice,
      mobile: player.mobile || '',
      description: player.description || '',
      stats: player.stats || '',
      playerImageUrl: player.playerImageUrl || '',
    });
    setPlayerDialogOpen(true);
  };

  const handlePlayerSubmit = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }

    if (!playerForm.name.trim() || !playerForm.role || !playerForm.basePrice) {
      toast.error('Name, role and base price are required');
      return;
    }

    setPlayerSubmitting(true);
    try {
      const payload = {
        ...playerForm,
        name: playerForm.name.trim(),
      };

      if (playerDialogMode === 'create') {
        const response = await axiosClient.post<{ player?: Player }>('/api/auction/players', payload);
        const createdPlayer = response.data.player;
        if (createdPlayer) {
          setPlayers((prev) => [createdPlayer, ...prev.filter(Boolean)]);
        } else {
          await fetchData();
        }
        toast.success('Player added successfully');
        setPlayerForm({
          ...defaultPlayerForm,
          basePrice: allowedBasePrices[0] || 2000,
        });
      } else if (editingPlayer) {
        const response = await axiosClient.put<{ player?: Player }>(`/api/auction/players/${editingPlayer.id}`, payload);
        const updatedPlayer = response.data.player;
        if (updatedPlayer) {
          setPlayers((prev) =>
            prev
              .filter(Boolean)
              .map((item) => (item.id === editingPlayer.id ? updatedPlayer : item))
          );
        } else {
          setPlayers((prev) =>
            prev
              .filter(Boolean)
              .map((item) =>
                item.id === editingPlayer.id
                  ? {
                      ...item,
                      ...payload,
                    }
                  : item
              )
          );
        }
        toast.success('Player updated successfully');
      }

      setPlayerDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save player'));
    } finally {
      setPlayerSubmitting(false);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }
    setPlayerToDelete(player);
    setDeletePlayerDialogOpen(true);
  };

  const openSaleDialog = (player: Player) => {
    setSalePlayer(player);
    setSaleTeamId(player.teamId ? String(player.teamId) : '');
    setSalePrice(player.soldPrice ? String(player.soldPrice) : String(player.basePrice));
    setSaleDialogOpen(true);
  };

  const handleSaveSale = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }

    if (!salePlayer || !saleTeamId || !salePrice) {
      toast.error('Team and sold price are required');
      return;
    }

    setSaleSubmitting(true);
    try {
      await axiosClient.put('/api/auction/players/sell', {
        playerId: salePlayer.id,
        teamId: Number(saleTeamId),
        soldPrice: Number(salePrice),
      });
      toast.success('Player sale details updated');
      setSaleDialogOpen(false);
      await fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update sale details'));
    } finally {
      setSaleSubmitting(false);
    }
  };

  const handleMarkUnsold = (player: Player) => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }
    setPlayerToMarkUnsold(player);
    setUnsoldPlayerDialogOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;
    setDeletePlayerSubmitting(true);
    try {
      const response = await axiosClient.delete<{
        deletedPlayerId?: number;
        refundedTeamId?: number | null;
        refundedAmount?: number | null;
      }>(`/api/auction/players/${playerToDelete.id}`);
      toast.success('Player deleted successfully');
      const deletedId = response.data.deletedPlayerId ?? playerToDelete.id;
      setPlayers((prev) => prev.filter((item) => item.id !== deletedId));
      applyTeamRefund(response.data.refundedTeamId, response.data.refundedAmount);
      setDeletePlayerDialogOpen(false);
      setPlayerToDelete(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete player'));
    } finally {
      setDeletePlayerSubmitting(false);
    }
  };

  const confirmMarkUnsold = async () => {
    if (!playerToMarkUnsold) return;
    setMarkUnsoldSubmitting(true);
    try {
      const response = await axiosClient.put<{
        player?: Player;
        refundedTeamId?: number | null;
        refundedAmount?: number | null;
      }>(`/api/auction/players/${playerToMarkUnsold.id}/unsold`);
      toast.success('Player marked unsold');
      const updatedPlayer = response.data.player;
      if (updatedPlayer) {
        setPlayers((prev) =>
          prev.map((item) => (item.id === updatedPlayer.id ? updatedPlayer : item))
        );
      } else {
        setPlayers((prev) =>
          prev.map((item) =>
            item.id === playerToMarkUnsold.id
              ? {
                  ...item,
                  isSold: false,
                  isUnsold: true,
                  soldPrice: null,
                  teamId: null,
                }
              : item
          )
        );
      }
      const fallbackRefundedTeamId =
        response.data.refundedTeamId ??
        (playerToMarkUnsold.teamId && playerToMarkUnsold.soldPrice ? playerToMarkUnsold.teamId : null);
      const fallbackRefundedAmount =
        response.data.refundedAmount ??
        (playerToMarkUnsold.teamId && playerToMarkUnsold.soldPrice ? playerToMarkUnsold.soldPrice : null);
      applyTeamRefund(fallbackRefundedTeamId, fallbackRefundedAmount);
      setUnsoldPlayerDialogOpen(false);
      setPlayerToMarkUnsold(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to mark player unsold'));
    } finally {
      setMarkUnsoldSubmitting(false);
    }
  };

  const handleMarkAllUnsold = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }

    if (bulkUnsoldConfirmText.trim().toLowerCase() !== 'yes confirm') {
      toast.error('Please type "yes confirm" to continue');
      return;
    }

    setBulkUnsoldSubmitting(true);
    try {
      const response = await axiosClient.put('/api/auction/players/unsold-all');
      toast.success(response.data?.message || 'All players marked unsold');
      setBulkUnsoldDialogOpen(false);
      setBulkUnsoldConfirmText('');
      await fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to mark all players unsold'));
    } finally {
      setBulkUnsoldSubmitting(false);
    }
  };

  const openExchangeDialog = () => {
    setExchangeIncomingPlayerId('');
    setExchangeRequestedTeamId('');
    setExchangeOutgoingPlayerId('');
    setExchangeCash('0');
    setExchangeDialogOpen(true);
  };

  const handleExchangePlayers = async () => {
    if (!isAdmin) {
      toast.error('Admin login required');
      return;
    }
    if (!isExchangeAllowed) {
      toast.error('Exchange feature is disabled in auction settings');
      return;
    }
    if (!exchangeIncomingPlayerId || !exchangeRequestedTeamId) {
      toast.error('Incoming player and requested team are required');
      return;
    }

    const normalizedCash = Number(exchangeCash || 0);
    if (!Number.isInteger(normalizedCash) || normalizedCash < 0) {
      toast.error('Cash adjustment must be a non-negative integer');
      return;
    }

    setExchangeSubmitting(true);
    try {
      await axiosClient.post('/api/auction/players/exchange', {
        incomingPlayerId: Number(exchangeIncomingPlayerId),
        requestedTeamId: Number(exchangeRequestedTeamId),
        outgoingPlayerId: exchangeOutgoingPlayerId ? Number(exchangeOutgoingPlayerId) : undefined,
        cashToOtherTeam: normalizedCash,
      });
      toast.success('Exchange completed successfully');
      setExchangeDialogOpen(false);
      await fetchData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to exchange players'));
    } finally {
      setExchangeSubmitting(false);
    }
  };

  return (
    <div className="theme-page-bg min-h-screen text-foreground relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="theme-grid-overlay absolute inset-0 pointer-events-none"></div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-accent/10 rounded-full border border-border">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-accent text-xs font-semibold tracking-wide uppercase">Player Database</span>
            </div>
            <h1 className="theme-title-gradient text-4xl md:text-5xl font-black tracking-tight">
              All Players
            </h1>
            <p className="theme-muted mt-2 text-sm md:text-base">
              Browse, search, and filter {players.length} players for the auction
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && !authLoading && (
              <>
                <Button
                  onClick={openCreateDialog}
                  className={uiTokens.adminPrimaryButton}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
                <Button
                  onClick={() => {
                    setBulkUnsoldConfirmText('');
                    setBulkUnsoldDialogOpen(true);
                  }}
                  className={uiTokens.adminWarningButton}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Mark All Unsold
                </Button>
                <Button
                  onClick={openExchangeDialog}
                  disabled={!isExchangeAllowed}
                  className={`${uiTokens.adminSecondaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Exchange Players
                </Button>
              </>
            )}

            <Link href="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className={uiTokens.backHomeButton}>
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {isAuthenticated && !isAdmin && !authLoading && (
          <div className="mb-6 rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-primary">
            Admin-only controls (add/edit/delete/sold updates) are available after admin login.
          </div>
        )}
        {isAdmin && !authLoading && !isExchangeAllowed && (
          <div className="mb-6 rounded-xl border border-border bg-primary/10 px-4 py-3 text-sm text-foreground">
            Exchange feature is currently disabled. Enable it from Home → Auction Settings → Enable player exchange.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <div className="relative">
            <div className="theme-card-strong relative rounded-3xl p-6 shadow-2xl">
              <div className="relative mb-6 group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 theme-muted group-focus-within:text-primary transition-colors duration-300 z-10">
                  <Search className="h-5 w-5" />
                </div>

                <Input
                  type="text"
                  placeholder="Search by player name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="relative pl-14 pr-12 py-7 bg-input/90 border-2 border-border focus:border-ring placeholder:text-muted-foreground text-foreground rounded-2xl text-base font-medium focus:ring-2 focus:ring-ring/30 transition-all duration-300 shadow-inner"
                />

                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-secondary/80 hover:bg-muted rounded-full transition-colors duration-200 z-10"
                  >
                    <X className="h-4 w-4 text-foreground/80" />
                  </motion.button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground/80">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Filters</span>
                    {hasActiveFilters && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-bold">
                        Active
                      </motion.span>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 border border-destructive/40 rounded-lg text-destructive text-xs font-semibold transition-colors duration-200"
                    >
                      <X className="h-3 w-3" />
                      Clear All
                    </motion.button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium theme-muted uppercase tracking-wider">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'sold', 'unsold'] as const).map((filter) => (
                      <motion.button
                        key={filter}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStatusFilter(filter)}
                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          statusFilter === filter
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-secondary/80 text-foreground/80 hover:bg-muted border border-border'
                        }`}
                      >
                        {statusFilter === filter && (
                          <motion.div
                            layoutId="statusFilter"
                            className="absolute inset-0 bg-primary rounded-xl"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 capitalize">{filter}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium theme-muted uppercase tracking-wider">Base Price</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', ...allowedBasePrices] as (number | 'all')[]).map((price) => (
                      <motion.button
                        key={price}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPriceFilter(price)}
                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          priceFilter === price
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-secondary/80 text-foreground/80 hover:bg-muted border border-border'
                        }`}
                      >
                        {priceFilter === price && (
                          <motion.div
                            layoutId="priceFilter"
                            className="absolute inset-0 bg-primary rounded-xl"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{price === 'all' ? 'All Prices' : `₹${(price / 1000).toFixed(0)}K`}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium theme-muted uppercase tracking-wider">Player Role</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'BATSMAN', 'BOWLER', 'ALLROUNDER'] as const).map((role) => (
                      <motion.button
                        key={role}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRoleFilter(role)}
                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          roleFilter === role
                            ? 'bg-accent text-accent-foreground shadow-lg'
                            : 'bg-secondary/80 text-foreground/80 hover:bg-muted border border-border'
                        }`}
                      >
                        {roleFilter === role && (
                          <motion.div
                            layoutId="roleFilter"
                            className="absolute inset-0 bg-accent rounded-xl"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{role === 'all' ? 'All Roles' : role}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-border flex items-center gap-2 theme-muted">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-sm">
                  Showing <span className="font-bold text-accent">{filteredPlayers.length}</span> of{' '}
                  <span className="font-bold text-foreground">{players.length}</span> players
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative overflow-hidden theme-card backdrop-blur-xl border border-border rounded-2xl h-[280px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/30 to-transparent animate-shimmer" />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredPlayers.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <PlayerCard
                    player={player}
                    teams={teams}
                    isAdmin={isAdmin}
                    onEdit={openEditDialog}
                    onDelete={handleDeletePlayer}
                    onManageSale={openSaleDialog}
                    onMarkUnsold={handleMarkUnsold}
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
              <div className="relative theme-card backdrop-blur-xl border-2 border-border rounded-3xl p-16 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center p-6 bg-primary/15 rounded-full mb-6 border border-border"
                >
                  <Search className="h-12 w-12 text-primary" />
                </motion.div>

                <h3 className="text-2xl font-black text-foreground mb-3">No Players Found</h3>
                <p className="theme-muted max-w-md mx-auto mb-6 leading-relaxed">
                  We couldn&apos;t find any players matching your current filters. Try adjusting your search criteria.
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className={`${uiTokens.adminPrimaryButton} px-6 py-3 rounded-xl inline-flex items-center gap-2`}
                >
                  <X className="h-5 w-5" />
                  Clear All Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className={uiTokens.dialogContentWide}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>{playerDialogMode === 'create' ? 'Add Player' : 'Edit Player'}</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              {playerDialogMode === 'create'
                ? 'Create a new player from this page.'
                : `Update details for ${editingPlayer?.name || 'this player'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="player-name">Name</Label>
              <Input
                id="player-name"
                value={playerForm.name}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Player name"
                className={uiTokens.formInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="player-role">Role</Label>
                <select
                  id="player-role"
                  value={playerForm.role}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, role: e.target.value as PlayerFormState['role'] }))}
                  className={uiTokens.formSelect}
                >
                  <option value="BATSMAN">BATSMAN</option>
                  <option value="BOWLER">BOWLER</option>
                  <option value="ALLROUNDER">ALLROUNDER</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label className={uiTokens.formLabel} htmlFor="player-base-price">Base Price</Label>
                <select
                  id="player-base-price"
                  value={String(playerForm.basePrice)}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, basePrice: Number(e.target.value) }))}
                  className={uiTokens.formSelect}
                >
                  {allowedBasePrices.map((price) => (
                    <option key={price} value={price}>{price}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="player-mobile">Mobile</Label>
              <Input
                id="player-mobile"
                value={playerForm.mobile}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, mobile: e.target.value }))}
                placeholder="Optional"
                className={uiTokens.formInput}
              />
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="player-image">Player Image URL</Label>
              <Input
                id="player-image"
                value={playerForm.playerImageUrl}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, playerImageUrl: e.target.value }))}
                placeholder="https://..."
                className={uiTokens.formInput}
              />
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="player-description">Description</Label>
              <textarea
                id="player-description"
                value={playerForm.description}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={uiTokens.formTextarea}
              />
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="player-stats">Stats</Label>
              <textarea
                id="player-stats"
                value={playerForm.stats}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, stats: e.target.value }))}
                rows={3}
                className={uiTokens.formTextarea}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPlayerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlayerSubmit} disabled={playerSubmitting}>
              {playerSubmitting ? 'Saving...' : playerDialogMode === 'create' ? 'Add Player' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>{salePlayer?.isSold ? 'Edit Sold Details' : 'Set Player Sold'}</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Change sold team and sold price, or later mark this player unsold from the card action.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel}>Player</Label>
              <div className="rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground/80">{salePlayer?.name || '-'}</div>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="sale-team">Team</Label>
              <select
                id="sale-team"
                value={saleTeamId}
                onChange={(e) => setSaleTeamId(e.target.value)}
                className={uiTokens.formSelect}
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="sale-price">Sold Price</Label>
              <Input
                id="sale-price"
                type="number"
                min={1}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter sold price"
                className={uiTokens.formInput}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSale} disabled={saleSubmitting}>
              {saleSubmitting ? 'Saving...' : 'Save Sold Details'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unsoldPlayerDialogOpen} onOpenChange={setUnsoldPlayerDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Mark Player Unsold</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Mark <span className="font-bold text-primary">{playerToMarkUnsold?.name || 'this player'}</span> as unsold?
              If currently sold, the related team purse will be adjusted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnsoldPlayerDialogOpen(false);
                setPlayerToMarkUnsold(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmMarkUnsold} disabled={markUnsoldSubmitting}>
              {markUnsoldSubmitting ? 'Applying...' : 'Confirm Mark Unsold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletePlayerDialogOpen} onOpenChange={setDeletePlayerDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Delete Player</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Delete <span className="font-bold text-destructive">{playerToDelete?.name || 'this player'}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletePlayerDialogOpen(false);
                setPlayerToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeletePlayer} disabled={deletePlayerSubmitting}>
              {deletePlayerSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkUnsoldDialogOpen} onOpenChange={setBulkUnsoldDialogOpen}>
        <DialogContent className={uiTokens.dialogContent}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Mark All Players Unsold</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              This will mark every player as unsold and clear sold team/price for all records.
              Type <span className="font-bold text-primary">yes confirm</span> to proceed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label className={uiTokens.formLabel} htmlFor="bulk-unsold-confirm">Confirmation</Label>
            <Input
              id="bulk-unsold-confirm"
              value={bulkUnsoldConfirmText}
              onChange={(e) => setBulkUnsoldConfirmText(e.target.value)}
              placeholder='Type: yes confirm'
              className={uiTokens.formInput}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkUnsoldDialogOpen(false);
                setBulkUnsoldConfirmText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkAllUnsold}
              disabled={bulkUnsoldSubmitting || bulkUnsoldConfirmText.trim().toLowerCase() !== 'yes confirm'}
            >
              {bulkUnsoldSubmitting ? 'Applying...' : 'Confirm Mark All Unsold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent className={uiTokens.dialogContentWide}>
          <DialogHeader>
            <DialogTitle className={uiTokens.dialogTitle}>Exchange Players</DialogTitle>
            <DialogDescription className={uiTokens.dialogDescription}>
              Transfer a sold player to another team, optionally swap one player back and/or add purse compensation.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="exchange-incoming-player">Incoming Player</Label>
              <select
                id="exchange-incoming-player"
                value={exchangeIncomingPlayerId}
                onChange={(e) => {
                  setExchangeIncomingPlayerId(e.target.value);
                  setExchangeRequestedTeamId('');
                  setExchangeOutgoingPlayerId('');
                }}
                className={uiTokens.formSelect}
              >
                <option value="">Select sold player</option>
                {soldPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({teams.find((t) => t.id === player.teamId)?.name || 'Unknown Team'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="exchange-requested-team">Requested Team (gets incoming player)</Label>
              <select
                id="exchange-requested-team"
                value={exchangeRequestedTeamId}
                onChange={(e) => {
                  setExchangeRequestedTeamId(e.target.value);
                  setExchangeOutgoingPlayerId('');
                }}
                className={uiTokens.formSelect}
                disabled={!exchangeIncomingPlayerId}
              >
                <option value="">Select team</option>
                {availableRequestedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="exchange-outgoing-player">Outgoing Player (optional swap)</Label>
              <select
                id="exchange-outgoing-player"
                value={exchangeOutgoingPlayerId}
                onChange={(e) => setExchangeOutgoingPlayerId(e.target.value)}
                className={uiTokens.formSelect}
                disabled={!exchangeRequestedTeamId}
              >
                <option value="">No outgoing player</option>
                {outgoingPlayerOptions.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className={uiTokens.formLabel} htmlFor="exchange-cash">Cash To Other Team (optional)</Label>
              <Input
                id="exchange-cash"
                type="number"
                min={0}
                value={exchangeCash}
                onChange={(e) => setExchangeCash(e.target.value)}
                placeholder="0"
                className={uiTokens.formInput}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExchangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExchangePlayers}
              disabled={exchangeSubmitting || !exchangeIncomingPlayerId || !exchangeRequestedTeamId}
            >
              {exchangeSubmitting ? 'Applying...' : 'Confirm Exchange'}
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

export default Players;

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gavel, IndianRupee, Users, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuctionPlayer, TeamSummary } from '@/app/types/type';

interface SellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: TeamSummary[];
  currentPlayer: AuctionPlayer | null;
  onSell: (teamId: string, soldPrice: number) => void | Promise<void>;
  defaultPrice: number;
  isPending: boolean;
  serverError: string | null;
  maxPlayersPerTeam: number;
}

const formatInr = (value: number) => value.toLocaleString('en-IN');

const SellDialog = ({
  open,
  onOpenChange,
  teams,
  currentPlayer,
  onSell,
  defaultPrice,
  isPending,
  serverError,
  maxPlayersPerTeam,
}: SellDialogProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  const selectedTeam = teams.find((t) => t.teamId.toString() === selectedTeamId);
  const parsedCustomPrice = parseInt(customPrice, 10);
  const finalPrice = useCustomPrice
    ? Number.isNaN(parsedCustomPrice)
      ? 0
      : parsedCustomPrice
    : defaultPrice;

  const hasEnoughPurse = selectedTeam ? selectedTeam.remainingPurse >= finalPrice : true;
  const isSquadFull = selectedTeam ? selectedTeam.totalPlayers >= maxPlayersPerTeam : false;
  const isPriceValid = finalPrice > 0;
  const canConfirm = Boolean(selectedTeamId) && hasEnoughPurse && !isSquadFull && isPriceValid && !isPending;

  const handleConfirm = () => {
    if (!canConfirm) return;
    void onSell(selectedTeamId, finalPrice);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent
        className="theme-card-strong max-h-[90vh] overflow-y-auto text-foreground shadow-2xl sm:max-w-2xl"
        showCloseButton={!isPending}
      >
        <DialogHeader className="space-y-4 border-b border-border/70 pb-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary p-3 shadow-lg">
              <Gavel className="h-6 w-6 text-primary-foreground" aria-hidden />
            </span>
            <div>
              <DialogTitle className="text-2xl text-foreground">Complete the Sale</DialogTitle>
              <DialogDescription className="mt-1 text-muted-foreground">
                Finalize the auction for{' '}
                <span className="font-bold text-accent">{currentPlayer?.name}</span>
              </DialogDescription>
            </div>
          </div>

          <div className="theme-card flex items-center justify-between rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-accent/20 p-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Base Price</p>
                <p className="flex items-center gap-1 text-xl font-black tabular-nums text-accent">
                  <IndianRupee className="h-4 w-4" aria-hidden />
                  {currentPlayer ? formatInr(currentPlayer.basePrice) : '—'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-lg font-bold text-foreground">{currentPlayer?.role}</p>
            </div>
          </div>

          <div className="theme-card rounded-xl border-2 border-primary/40 p-5 text-center">
            <p className="mb-2 text-sm font-medium text-foreground/80">Final Sale Price</p>
            <p className="flex items-center justify-center gap-2">
              <IndianRupee className="h-7 w-7 text-primary" aria-hidden />
              <span className="text-5xl font-black tabular-nums text-primary">
                {formatInr(finalPrice)}
              </span>
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-5">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sale Price</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseCustomPrice(false)}
                disabled={isPending}
                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 disabled:opacity-60 ${
                  !useCustomPrice
                    ? 'border-accent/50 bg-accent/20'
                    : 'border-border bg-card/70 hover:border-ring/60'
                }`}
              >
                <span className="mb-1 block text-xs text-muted-foreground">Current Bid</span>
                <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-foreground">
                  <IndianRupee className="h-4 w-4" aria-hidden />
                  {formatInr(defaultPrice)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUseCustomPrice(true)}
                disabled={isPending}
                className={`rounded-xl border-2 p-4 text-left transition-all duration-200 disabled:opacity-60 ${
                  useCustomPrice
                    ? 'border-primary/50 bg-primary/20'
                    : 'border-border bg-card/70 hover:border-ring/60'
                }`}
              >
                <span className="mb-1 block text-xs text-muted-foreground">Custom Price</span>
                <span className="text-lg font-bold text-primary">Manual Entry</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {useCustomPrice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="customPrice" className="text-sm font-semibold text-foreground/80">
                    Enter Sale Price
                  </Label>
                  <div className="relative">
                    <IndianRupee
                      aria-hidden
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
                    />
                    <Input
                      id="customPrice"
                      type="number"
                      inputMode="numeric"
                      placeholder="Enter custom price"
                      value={customPrice}
                      disabled={isPending}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-12 border-2 border-border bg-input/90 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
                      min="0"
                    />
                  </div>
                  {customPrice &&
                    currentPlayer &&
                    parsedCustomPrice > 0 &&
                    parsedCustomPrice < currentPlayer.basePrice && (
                      <p className="flex items-center gap-1 text-xs text-chart-5">
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                        Below the base price of ₹{formatInr(currentPlayer.basePrice)}
                      </p>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <Label htmlFor="team" className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-chart-3" aria-hidden />
              Select Winning Team
            </Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={isPending}>
              <SelectTrigger
                id="team"
                className="h-14 border-2 border-border bg-input/90 text-base transition-all hover:border-ring/60 focus:ring-2 focus:ring-ring/30"
              >
                <SelectValue placeholder="Choose the team that won the bid..." />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                {teams.map((team) => {
                  const cannotAfford = team.remainingPurse < finalPrice;
                  const full = team.totalPlayers >= maxPlayersPerTeam;
                  return (
                    <SelectItem
                      key={team.teamId}
                      value={team.teamId.toString()}
                      disabled={cannotAfford || full}
                      className="cursor-pointer py-3 text-base focus:bg-accent/15"
                    >
                      <span className="flex w-full items-center justify-between gap-4">
                        <span className="font-semibold text-foreground">{team.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {team.totalPlayers}/{maxPlayersPerTeam}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-primary">
                            ₹{formatInr(team.remainingPurse)}
                          </span>
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <AnimatePresence>
              {selectedTeam && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`space-y-2 rounded-lg border p-4 ${
                      hasEnoughPurse && !isSquadFull
                        ? 'border-chart-3/40 bg-chart-3/10'
                        : 'border-destructive/40 bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/80">Squad size</span>
                      <span className="font-bold tabular-nums text-chart-3">
                        {selectedTeam.totalPlayers}/{maxPlayersPerTeam}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                      <span className="text-foreground/80">Purse after sale</span>
                      <span
                        className={`flex items-center gap-1 font-bold tabular-nums ${
                          hasEnoughPurse ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                        {formatInr(Math.max(0, selectedTeam.remainingPurse - finalPrice))}
                      </span>
                    </div>

                    {!hasEnoughPurse && (
                      <p className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/20 p-2 text-sm font-medium text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                        Short by ₹{formatInr(finalPrice - selectedTeam.remainingPurse)}
                      </p>
                    )}
                    {isSquadFull && (
                      <p className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/20 p-2 text-sm font-medium text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                        Squad is already full ({maxPlayersPerTeam} players)
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {serverError && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/15 p-3 text-sm font-medium text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-3 border-t border-border/70 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-12 flex-1 border-2 border-border bg-secondary font-semibold text-foreground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-12 flex-1 bg-primary text-lg font-black text-primary-foreground shadow-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                Selling…
              </>
            ) : (
              <>
                <Gavel className="mr-2 h-5 w-5" aria-hidden />
                Confirm Sale
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SellDialog;

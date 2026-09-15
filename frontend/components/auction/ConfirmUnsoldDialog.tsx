'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmUnsoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string | undefined;
  isPending: boolean;
  onConfirm: () => void;
}

const ConfirmUnsoldDialog = ({
  open,
  onOpenChange,
  playerName,
  isPending,
  onConfirm,
}: ConfirmUnsoldDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
    <DialogContent className="theme-card-strong max-w-md text-foreground">
      <DialogHeader>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-xl bg-destructive/15 p-2.5">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
          </span>
          <DialogTitle className="text-2xl text-foreground">Mark as unsold?</DialogTitle>
        </div>
        <DialogDescription className="text-muted-foreground">
          <span className="font-bold text-foreground">{playerName}</span> will be moved out of the
          current pool. They return automatically in the next round, where their base price resets
          to ₹2,000.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="h-11 flex-1 border border-border bg-secondary font-semibold text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="h-11 flex-1 bg-destructive font-black text-destructive-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Mark Unsold
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmUnsoldDialog;

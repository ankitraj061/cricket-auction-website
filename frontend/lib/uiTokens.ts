export const uiTokens = {
  adminPrimaryButton:
    'bg-primary text-primary-foreground hover:opacity-90 border border-border shadow-lg font-bold',
  adminSecondaryButton:
    'bg-secondary text-secondary-foreground hover:opacity-90 border border-border shadow-lg font-bold',
  adminWarningButton:
    'bg-destructive text-destructive-foreground hover:opacity-90 border border-border shadow-lg font-bold',
  backHomeButton:
    'relative bg-accent text-accent-foreground hover:opacity-90 border border-border shadow-lg px-6 py-6 text-base font-bold',
  pageInfoBanner:
    'mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground',

  dialogContent:
    'max-w-lg bg-card border border-border text-card-foreground rounded-2xl',
  dialogContentWide:
    'max-w-xl bg-card border border-border text-card-foreground rounded-2xl',
  dialogTitle: 'text-xl font-black text-card-foreground',
  dialogDescription: 'text-muted-foreground text-sm',

  formLabel: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  formInput:
    'h-10 rounded-xl border border-input bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',
  formTextarea:
    'rounded-xl border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',
  formSelect:
    'h-10 rounded-xl border border-input bg-input px-3 text-sm text-foreground focus:border-ring focus:ring-2 focus:ring-ring/20',

  actionMenuTrigger:
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted',
  actionMenuContent:
    'w-48 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-xl',
} as const;

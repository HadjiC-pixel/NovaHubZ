export function generateLicenseKey(): string {
  const segments = ['kaoru', 'shield', 'sudo', 'gate', 'lock', 'vault', 'guard', 'armor'];
  const prefix = segments[Math.floor(Math.random() * segments.length)];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0 && i % 2 === 0) suffix += '-';
    for (let j = 0; j < (i % 2 === 0 ? 4 : 4); j++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `${prefix}-key-${suffix}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getExpiryLabel(key: { expiry_type: string; expires_at: string | null; max_executions: number | null }): string {
  if (key.expiry_type === 'permanent') return 'Never expires';
  if (key.expiry_type === 'timed' && key.expires_at) {
    const remaining = new Date(key.expires_at).getTime() - Date.now();
    if (remaining < 0) return 'Expired';
    const hours = Math.floor(remaining / 3600000);
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.floor(hours / 24)}d remaining`;
  }
  if (key.expiry_type === 'execution_count' && key.max_executions !== null) {
    return `${key.max_executions} max executions`;
  }
  return 'Unknown';
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const date = new Date(timestamp * 1000);
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'modified':
      return 'text-git-modified';
    case 'new':
    case 'added':
      return 'text-git-added';
    case 'deleted':
      return 'text-git-removed';
    case 'renamed':
      return 'text-git-renamed';
    default:
      return 'text-git-untracked';
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'modified':
      return 'M';
    case 'new':
    case 'added':
      return 'A';
    case 'deleted':
      return 'D';
    case 'renamed':
      return 'R';
    case 'conflicted':
      return 'C';
    default:
      return '?';
  }
}

const BRANCH_COLOR_COUNT = 10;

export function getBranchColorIndex(colorIndex: number): number {
  return (
    ((colorIndex % BRANCH_COLOR_COUNT) + BRANCH_COLOR_COUNT) %
    BRANCH_COLOR_COUNT
  );
}

export function getBranchColorHsl(colorIndex: number): string {
  const idx = getBranchColorIndex(colorIndex);
  return `hsl(var(--branch-${idx}))`;
}

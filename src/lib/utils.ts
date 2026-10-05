import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, minimumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: Math.max(minimumFractionDigits, 2),
  }).format(amount);
}

export function getGoogleDriveDirectLink(url: string | undefined | null) {
  if (!url) return '';
  
  // Pattern to catch file ID from various Google Drive URL formats
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  
  return url;
}

/**
 * Convierte cualquier valor de fecha (Timestamp de Firestore, marcador pendiente de
 * serverTimestamp, Date, número o string) en un Date válido, o null si no se puede.
 */
export function toSafeDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatSafeDate(value: any, dateStyle: 'short' | 'medium' = 'medium', fallback = 'RECIENTE') {
  const d = toSafeDate(value);
  return d ? new Intl.DateTimeFormat('es-VE', { dateStyle }).format(d) : fallback;
}

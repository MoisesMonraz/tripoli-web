import { Redis } from '@upstash/redis';

export interface ShortURL {
  originalUrl: string;
  code: string;
  createdAt: number;
  clicks: number;
}

const redis = Redis.fromEnv();

// Generate random 5-character alphanumeric code
export function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate URL is from tripoli.media
export function isValidTripoliURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'tripoli.media' ||
           parsed.hostname === 'www.tripoli.media';
  } catch {
    return false;
  }
}

// Create shortened URL
export async function createShortURL(originalUrl: string): Promise<ShortURL | null> {
  if (!isValidTripoliURL(originalUrl)) return null;

  let code = generateCode();
  while (await redis.get(`url:${code}`)) {
    code = generateCode();
  }

  const shortURL: ShortURL = {
    originalUrl,
    code,
    createdAt: Date.now(),
    clicks: 0,
  };

  await redis.set(`url:${code}`, shortURL);
  await redis.lpush('url:codes', code);

  return shortURL;
}

// Get URL by code
export async function getShortURL(code: string): Promise<ShortURL | null> {
  return redis.get<ShortURL>(`url:${code}`);
}

// Increment click count
export async function incrementClicks(code: string): Promise<void> {
  const data = await redis.get<ShortURL>(`url:${code}`);
  if (data) {
    data.clicks += 1;
    await redis.set(`url:${code}`, data);
  }
}

// Get all shortened URLs sorted newest first
export async function getAllShortURLs(): Promise<ShortURL[]> {
  const codes = await redis.lrange<string>('url:codes', 0, -1);
  const urls: ShortURL[] = [];

  for (const code of codes) {
    const data = await redis.get<ShortURL>(`url:${code}`);
    if (data) urls.push(data);
  }

  return urls.sort((a, b) => b.createdAt - a.createdAt);
}

// Delete shortened URL
export async function deleteShortURL(code: string): Promise<boolean> {
  const exists = await redis.get(`url:${code}`);
  if (!exists) return false;

  await redis.del(`url:${code}`);
  await redis.lrem('url:codes', 1, code);
  return true;
}

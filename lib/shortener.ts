import { createClient } from 'redis';

export interface ShortURL {
  originalUrl: string;
  code: string;
  createdAt: number;
  clicks: number;
}

// Singleton Redis client
let _client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (_client && _client.isReady) return _client;
  _client = createClient({ url: process.env.KV_REDIS_URL });
  _client.on('error', (err) => console.error('Redis error:', err));
  await _client.connect();
  return _client;
}

async function redisGet<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

async function redisSet(key: string, value: unknown): Promise<void> {
  const redis = await getClient();
  await redis.set(key, JSON.stringify(value));
}

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
  while (await redisGet(`url:${code}`)) {
    code = generateCode();
  }

  const shortURL: ShortURL = {
    originalUrl,
    code,
    createdAt: Date.now(),
    clicks: 0,
  };

  await redisSet(`url:${code}`, shortURL);

  const redis = await getClient();
  await redis.lPush('url:codes', code);

  return shortURL;
}

// Get URL by code
export async function getShortURL(code: string): Promise<ShortURL | null> {
  return redisGet<ShortURL>(`url:${code}`);
}

// Increment click count
export async function incrementClicks(code: string): Promise<void> {
  const data = await redisGet<ShortURL>(`url:${code}`);
  if (data) {
    data.clicks += 1;
    await redisSet(`url:${code}`, data);
  }
}

// Get all shortened URLs sorted newest first
export async function getAllShortURLs(): Promise<ShortURL[]> {
  const redis = await getClient();
  const codes = await redis.lRange('url:codes', 0, -1);
  const urls: ShortURL[] = [];

  for (const code of codes) {
    const data = await redisGet<ShortURL>(`url:${code}`);
    if (data) urls.push(data);
  }

  return urls.sort((a, b) => b.createdAt - a.createdAt);
}

// Delete shortened URL
export async function deleteShortURL(code: string): Promise<boolean> {
  const exists = await redisGet(`url:${code}`);
  if (!exists) return false;

  const redis = await getClient();
  await redis.del(`url:${code}`);
  await redis.lRem('url:codes', 1, code);
  return true;
}

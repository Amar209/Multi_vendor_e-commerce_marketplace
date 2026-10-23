import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

let redisClient;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            console.warn('[Redis] Connection failed, switching to in-memory Redis mock.');
            redisClient = new RedisMock();
            return null;
          }
          return Math.min(times * 100, 2000);
        }
      });

      redisClient.on('connect', () => console.log('[Redis] Connected to Redis Cloud/Local instance'));
      redisClient.on('error', (err) => console.warn(`[Redis Notice] ${err.message}. Using mock fallback.`));
    } catch {
      redisClient = new RedisMock();
    }
  } else {
    console.log('[Redis] No REDIS_URL found. Initializing zero-cost In-Memory Redis Mock.');
    redisClient = new RedisMock();
  }

  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

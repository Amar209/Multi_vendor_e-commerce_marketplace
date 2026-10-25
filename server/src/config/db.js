import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      try {
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (connErr) {
        console.warn(`[Database] Could not connect to MONGO_URI (${connErr.message}). Falling back to In-Memory MongoDB...`);
      }
    }

    // Zero-cost zero-setup fallback: In-Memory MongoDB Server for local dev
    console.log('[Database] Starting zero-setup In-Memory MongoDB...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[Database] In-Memory MongoDB Ready: ${conn.connection.host} (${uri})`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

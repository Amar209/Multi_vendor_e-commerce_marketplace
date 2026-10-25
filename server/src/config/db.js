import mongoose from 'mongoose';

export const connectDB = async () => {
  let mongoUri = (process.env.MONGO_URI || '').trim().replace(/^['"]|['"]$/g, '');

  if (mongoUri) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000
      });
      console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    } catch (connErr) {
      console.error(`[Database Error] Could not connect to MONGO_URI: ${connErr.message}`);
    }
  }

  // Zero-cost zero-setup fallback: In-Memory MongoDB Server for local dev
  try {
    console.log('[Database] Attempting In-Memory MongoDB fallback...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[Database] In-Memory MongoDB Ready: ${conn.connection.host} (${uri})`);
  } catch (error) {
    console.warn(`[Database Notice] In-memory engine unavailable in cloud container: ${error.message}`);
  }
};

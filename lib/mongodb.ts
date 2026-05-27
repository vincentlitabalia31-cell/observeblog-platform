import mongoose from 'mongoose';

const globalForMongoose = global as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const MONGODB_URI =
  process.env.MONGODB_URI ??
  (process.env.NODE_ENV !== 'production' ? 'mongodb://127.0.0.1:27017/observing-india' : undefined);

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (!globalForMongoose.mongoose) {
    globalForMongoose.mongoose = { conn: null, promise: null };
  }

  if (globalForMongoose.mongoose.conn) {
    return globalForMongoose.mongoose.conn;
  }

  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10_000
    });
  }

  globalForMongoose.mongoose.conn = await globalForMongoose.mongoose.promise;
  return globalForMongoose.mongoose.conn;
}

export function disconnectDatabase() {
  return mongoose.disconnect();
}

export default mongoose;

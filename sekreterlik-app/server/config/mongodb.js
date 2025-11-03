const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'sekreterlik_messages';

let client = null;
let db = null;

const connectToMongoDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      console.log('MongoDB bağlantısı başarılı!');
    }
    
    if (!db) {
      db = client.db(DB_NAME);
    }
    
    return db;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('MongoDB bağlantısı kurulmamış!');
  }
  return db;
};

const closeConnection = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB bağlantısı kapatıldı!');
  }
};

module.exports = {
  connectToMongoDB,
  getDB,
  closeConnection
};

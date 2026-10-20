const mongoose = require('mongoose');

let connectionPromise;

function connectToDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI environment variable is required'));
  }

  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(uri)
    .then(() => mongoose.connection)
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });

  return connectionPromise;
}

module.exports = connectToDatabase;

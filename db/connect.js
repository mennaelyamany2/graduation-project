const mongoose = require('mongoose');

module.exports = () => {
  const url = process.env.DATABASE_URL.replace('<password>', process.env.DATABASE_PASSWORD);
  return mongoose.connect(url);
};

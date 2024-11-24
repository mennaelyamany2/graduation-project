const connectDB = require('./db/connect');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    console.log('Connecting to DB...');
    await connectDB();
    console.log('Connected to DB successfully');

    const server = app.listen(PORT, console.log(`Server is listening on port ${PORT}-${process.env.NODE_ENV}...`));

    process.on('unhandledRejection', (err) => {
      console.log('UNHANDLER REJECTION 💥 Shutting down...');
      console.log(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.log(`Error Connecting 💥 : ${error} `);
  }
})();

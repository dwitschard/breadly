// import dotenv from 'dotenv';
import {app} from './app.js';
import serverless from 'serverless-http';
// import { MONGODB_CONFIG } from './database/mongodb.config';

// dotenv.config();

// const PORT = 3000;

/*const startServer = async () => {
  await ApplicationDatabase.init(
    MONGODB_CONFIG.CONNECTION_STRING(),
    MONGODB_CONFIG.DB_NAME,
  );

  app.listen(PORT, () => {
    console.log('Server is running on port 3000');
  });
};*/


module.exports.handler = serverless(app);

//startServer();
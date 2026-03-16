import serverless from 'serverless-http';
import {app} from "./app.js";

export const handler = serverless(app);



// dotenv.config();
// const PORT = 3000;

/*const startServer = async () => {
  await ApplicationDatabase.init(
    MONGODB_CONFIG.CONNECTION_STRING(),
    MONGODB_CONFIG.DB_NAME,
  );µ

  app.listen(PORT, () => {
    console.log('Server is running on port 3000');
  });
};*/

// startServer();
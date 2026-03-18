import {app} from "./app";

// dotenv.config();
const PORT = process.env['PORT'] ?? 3000;

const startServer = async () => {
    /*
      await ApplicationDatabase.init(
        MONGODB_CONFIG.CONNECTION_STRING(),
        MONGODB_CONFIG.DB_NAME,
      );
      */

    app.listen(PORT, () => {
        console.log('Server is running on port 3000');
    });
};

startServer();
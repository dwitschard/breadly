import {app} from './app.js';
import 'dotenv/config';
import {ApplicationDatabase} from './database/application-database.js';
import {MONGODB_CONFIG} from './database/mongodb.config.js';
import {logger} from './common/logger.js';
import {migrateExistingReminders} from './features/reminder/reminder.service.js';
import {env} from './config/env.js';

const PORT = env.PORT;

const startServer = async () => {
    await ApplicationDatabase.init(
        MONGODB_CONFIG.CONNECTION_STRING(),
        MONGODB_CONFIG.DB_NAME,
    );

    migrateExistingReminders().catch((err) => {
        logger.error({ err }, 'Background reminder migration failed');
    });

    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
};

startServer();

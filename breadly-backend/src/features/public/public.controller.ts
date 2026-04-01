import express from 'express';

const publicController = express.Router();

publicController.get('/config', (req: express.Request, res: express.Response) => {
  const issuer = process.env['COGNITO_ISSUER'];
  const clientId = process.env['COGNITO_CLIENT_ID'];

  if (!issuer || !clientId) {
    res.status(503).json({ message: 'Configuration not available', statusCode: 503 });
    return;
  }

  res.json({ idp: { issuer, clientId } });
});

export { publicController };

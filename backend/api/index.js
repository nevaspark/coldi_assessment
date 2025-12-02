import serverless from 'serverless-http';
import app from '../src/app.js';
import { syncAll } from '../src/models/index.js';

// Ensure database/models are synced before handling requests
try {
  await syncAll();
} catch (err) {
  console.error('Error syncing DB in serverless function:', err);
}

export default serverless(app);

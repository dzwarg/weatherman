/**
 * Server entry point
 * Starts the Express server
 */

import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
});

export default app;

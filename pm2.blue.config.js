module.exports = {
  apps: [{
    name: 'weatherman-blue',
    script: './packages/server/src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      ENV_NAME: 'blue',
      WEATHER_API_KEY: process.env.WEATHER_API_KEY,
      WEATHER_API_URL: process.env.WEATHER_API_URL,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      CLAUDE_MODEL: process.env.CLAUDE_MODEL
    },
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    // Health check - PM2 will wait for ready event from app
    ready_timeout: 30000,
    // Restart policy
    max_restarts: 10,
    min_uptime: '10s',
    // Logging
    error_file: './logs/blue-error.log',
    out_file: './logs/blue-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Auto-restart on file changes (disabled in production)
    watch: false,
    // Graceful shutdown
    shutdown_with_message: false,
  }]
};

module.exports = {
  apps: [
    // API do MontShop
    {
      name: 'api-lojas',
      script: 'dist/src/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-err.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      // Iniciar automaticamente
      min_uptime: '10s',
      max_restarts: 10,
    },
    // Evolution API (WhatsApp)
    {
      name: 'evolution-api',
      script: 'npm',
      args: 'start',
      cwd: process.env.EVOLUTION_API_DIR || `${process.env.HOME}/evolution-api`,
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: './logs/evolution-err.log',
      out_file: './logs/evolution-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      // Aguardar um pouco mais para iniciar (Evolution API pode demorar)
      wait_ready: true,
      listen_timeout: 10000,
      // Iniciar automaticamente
      min_uptime: '10s',
      max_restarts: 10,
      // Delay para iniciar após a API do MontShop (opcional)
      // exec_delay: 5000,
    },
  ],
};


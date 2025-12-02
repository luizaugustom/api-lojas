// PM2 Ecosystem Configuration
// Gerencia tanto a API do MontShop quanto a Evolution API

module.exports = {
  apps: [
    // API do MontShop
    {
      name: 'api-lojas',
      script: 'dist/src/main.js',
      cwd: process.cwd(),
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
      ignore_watch: ['node_modules', 'logs', 'dist'],
      // Aguardar 10 segundos antes de considerar como iniciado
      min_uptime: '10s',
      // Tentar reiniciar até 10 vezes
      max_restarts: 10,
      // Aguardar 5 segundos entre reinicializações
      restart_delay: 5000,
    },
    // Evolution API
    {
      name: 'evolution-api',
      script: 'npm',
      args: 'start',
      cwd: '/opt/evolution-api/evolution-api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: '/opt/evolution-api/evolution-api/logs/evolution-err.log',
      out_file: '/opt/evolution-api/evolution-api/logs/evolution-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'instances', 'store'],
      // Aguardar 15 segundos antes de considerar como iniciado
      min_uptime: '15s',
      // Tentar reiniciar até 10 vezes
      max_restarts: 10,
      // Aguardar 5 segundos entre reinicializações
      restart_delay: 5000,
    },
  ],
};


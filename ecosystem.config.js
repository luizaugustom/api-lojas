module.exports = {
  apps: [
    // API MontShop
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
      // Aguardar 5 segundos antes de considerar que falhou
      listen_timeout: 10000,
      // Reiniciar se usar mais de 1GB de memória
      max_memory_restart: '1G',
      // Reiniciar após 3 falhas consecutivas
      min_uptime: '10s',
      max_restarts: 10,
    },
    // Evolution API
    {
      name: 'evolution-api',
      script: 'npm',
      args: 'start',
      cwd: process.env.EVOLUTION_API_DIR || require('os').homedir() + '/evolution-api',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
      error_file: (process.env.EVOLUTION_API_DIR || require('os').homedir() + '/evolution-api') + '/logs/evolution-err.log',
      out_file: (process.env.EVOLUTION_API_DIR || require('os').homedir() + '/evolution-api') + '/logs/evolution-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'instances', 'store'],
      // Aguardar mais tempo para a Evolution API iniciar
      listen_timeout: 30000,
      // Reiniciar se usar mais de 512MB de memória
      max_memory_restart: '512M',
      // Reiniciar após 3 falhas consecutivas
      min_uptime: '30s',
      max_restarts: 10,
      // Aguardar a Evolution API iniciar antes de considerar sucesso
      wait_ready: true,
      kill_timeout: 5000,
    },
  ],
};


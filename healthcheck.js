const http = require('http');

const PORT = process.env.PORT || process.env.APP_PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const TIMEOUT = parseInt(process.env.HEALTHCHECK_TIMEOUT || '2000');

const options = {
  host: HOST,
  port: PORT,
  path: '/health',
  timeout: TIMEOUT,
};

console.log(`Health check: ${HOST}:${PORT}/health`);

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('Health check error:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error(`Health check timeout after ${TIMEOUT}ms`);
  request.destroy();
  process.exit(1);
});

request.end();

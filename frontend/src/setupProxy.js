const history = require('connect-history-api-fallback');
const { createProxyMiddleware } = require('http-proxy-middleware');

const rawTarget =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:8000';
const target = rawTarget.replace(/\/api\/?$/, '');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      ws: true,
    })
  );

  app.use(
    history({
      index: '/index.html',
      verbose: false,
    })
  );
};

import { Hono } from 'hono';
import { Env } from './types';
import { api } from './router';

const app = new Hono<{ Bindings: Env }>();

// Mount API routes under /api
app.route('/api', api);

// Serve static assets or fallback
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    return await c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Auditable Deep Research Agent API is running.', 200);
});

export default {
  fetch: app.fetch,
};

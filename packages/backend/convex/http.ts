import { httpRouter } from 'convex/server';

import { auth } from './auth';
import { lemonWebhook } from './billing';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: '/billing/webhook',
  method: 'POST',
  handler: lemonWebhook,
});

export default http;

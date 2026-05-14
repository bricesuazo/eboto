import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { lemonWebhook } from './billing';
import { handleUnsubscribe } from './voterBlast';

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: '/billing/webhook',
  method: 'POST',
  handler: lemonWebhook,
});

// Unsubscribe handler — GET when clicked from the email body, POST for
// RFC 8058 one-click unsubscribe headers.
http.route({
  path: '/api/unsubscribe',
  method: 'GET',
  handler: handleUnsubscribe,
});
http.route({
  path: '/api/unsubscribe',
  method: 'POST',
  handler: handleUnsubscribe,
});

export default http;

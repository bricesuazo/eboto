import aggregate from '@convex-dev/aggregate/convex.config';
import { defineApp } from 'convex/server';

const app = defineApp();
app.use(aggregate, { name: 'votersByElection' });
app.use(aggregate, { name: 'votedByElection' });

export default app;

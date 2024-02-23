import { LemonSqueezy } from "@lemonsqueezy/lemonsqueezy.js";

import { env } from "./env.mjs";

export const payment = new LemonSqueezy(env.LEMONSQUEEZY_API_KEY);

export type { LemonSqueezy };

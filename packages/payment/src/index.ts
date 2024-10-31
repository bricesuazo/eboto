import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import { env } from "./env";

lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });

export * from "@lemonsqueezy/lemonsqueezy.js";

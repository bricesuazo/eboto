import { ConvexError, v } from 'convex/values';

import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  action,
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import { requireCommissioner, requireUser } from './_helpers/auth';
import {
  BOOST_PRICE_TO_VOTER_CAP,
  BOOST_PRICES,
  getElectionTier,
} from './_helpers/billing';

/* ------------------------------------------------------------------ */
/* Queries                                                              */
/* ------------------------------------------------------------------ */

/** Number of unredeemed Plus credits the current user has. */
export const myCreditCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const credits = await ctx.db
      .query('elections_plus')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('redeemedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .collect();
    return credits.length;
  },
});

/**
 * Quota for creating a new election: 1 free election per account, then one
 * extra per unredeemed `elections_plus` credit. The new-election page uses
 * this to render an explicit "buy Plus" prompt instead of letting the user
 * submit and hit a server-side error.
 */
export const myElectionQuota = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const owned = await ctx.db
      .query('commissioners')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    let activeOwnedCount = 0;
    for (const c of owned) {
      const election = await ctx.db.get(c.electionId);
      if (election && !election.deletedAt) activeOwnedCount++;
    }

    const credits = await ctx.db
      .query('elections_plus')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.eq(q.field('redeemedAt'), undefined),
          q.eq(q.field('deletedAt'), undefined),
        ),
      )
      .collect();

    return {
      ownedCount: activeOwnedCount,
      plusCredits: credits.length,
      canCreateFree: activeOwnedCount === 0,
      canCreateWithCredit: activeOwnedCount > 0 && credits.length > 0,
    };
  },
});

/**
 * Returns the tier + feature flags for an election by slug. Used by the
 * dashboard to drive paywall UI (messages page, upgrade banner). Caller must
 * be a commissioner of the election.
 */
export const getElectionTierBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;
    await requireCommissioner(ctx, election._id);
    return {
      electionId: election._id,
      ...getElectionTier(election),
    };
  },
});

/**
 * Summary for the `/account/billing` page: Plus credit ledger (total/used)
 * and the list of Boost elections the user owns. Linked tier rows surface
 * voter cap so the user can see what they paid for at a glance.
 */
export const myBillingSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const credits = await ctx.db
      .query('elections_plus')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const commissionerRows = await ctx.db
      .query('commissioners')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const boostElections: {
      _id: string;
      name: string;
      slug: string;
      voterCap: number;
      isBoost: boolean;
    }[] = [];
    for (const c of commissionerRows) {
      const election = await ctx.db.get(c.electionId);
      if (!election || election.deletedAt) continue;
      const tier = getElectionTier(election);
      if (tier.isBoost) {
        boostElections.push({
          _id: election._id,
          name: election.name,
          slug: election.slug,
          voterCap: tier.voterCap,
          isBoost: true,
        });
      }
    }

    return {
      plus: {
        owned: credits.length,
        available: credits.filter((c) => !c.redeemedAt).length,
        redeemed: credits.filter((c) => Boolean(c.redeemedAt)).length,
      },
      boostElections,
    };
  },
});

/**
 * Public variant — anyone can read whether an election is on a paid tier so
 * the public election page can hide the eBoto watermark on Boost elections.
 * Exposes feature flags + tier label only, not the voter cap or any
 * commissioner-only info.
 */
export const getPublicElectionFeatures = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;
    const tier = getElectionTier(election);
    return {
      isBoost: tier.isBoost,
      features: tier.features,
    };
  },
});

/* ------------------------------------------------------------------ */
/* Internal mutations / queries used by the actions + webhook           */
/* ------------------------------------------------------------------ */

export const requireUserId = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<'users'>> => requireUser(ctx),
});

export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<Doc<'users'> | null> =>
    ctx.db.get(userId),
});

export const requireBoostContext = internalQuery({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    const { userId } = await requireCommissioner(ctx, electionId);
    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }
    const user = await ctx.db.get(userId);
    return {
      userId,
      election: {
        _id: election._id,
        slug: election.slug,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
      },
    };
  },
});

/**
 * Looks up the LemonSqueezy variant for a Boost price tier. Mirrors v1's
 * pattern: `variants` table is pre-seeded (see `syncBoostVariants`), and
 * checkout creation reads by `(productId, price)`.
 */
export const getBoostVariantByPrice = internalQuery({
  args: { lemonProductId: v.number(), price: v.number() },
  handler: async (ctx, { lemonProductId, price }) => {
    const product = await ctx.db
      .query('products')
      .withIndex('by_lemon', (q) => q.eq('lemonId', lemonProductId))
      .first();
    if (!product) return null;
    const variant = await ctx.db
      .query('variants')
      .withIndex('by_product', (q) => q.eq('productId', product._id))
      .filter((q) => q.eq(q.field('price'), price))
      .first();
    return variant ? { lemonId: variant.lemonId, price: variant.price } : null;
  },
});

/** Lookup a variant by its LemonSqueezy id — used by the webhook. */
export const getVariantByLemonId = internalQuery({
  args: { lemonId: v.number() },
  handler: async (ctx, { lemonId }): Promise<Doc<'variants'> | null> => {
    return await ctx.db
      .query('variants')
      .withIndex('by_lemon', (q) => q.eq('lemonId', lemonId))
      .first();
  },
});

/**
 * Grants the user one "elections_plus" credit, redeemable when they create
 * their next election. Caller is expected to invoke this `quantity` times if
 * the buyer purchased multiple credits.
 */
export const grantElectionsPlus = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await ctx.db.insert('elections_plus', { userId });
  },
});

/**
 * Upgrades the election to the purchased Boost tier. Idempotent: a re-emit
 * of the same order from LemonSqueezy will overwrite the same fields with
 * the same values.
 */
export const upgradeElectionBoost = internalMutation({
  args: {
    electionId: v.id('elections'),
    variantId: v.number(),
    voterCap: v.number(),
  },
  handler: async (ctx, { electionId, variantId, voterCap }) => {
    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) return;
    await ctx.db.patch(electionId, { variantId, voterCap });
  },
});

/** Upserts the products / variants rows from a LemonSqueezy sync. */
export const upsertProductWithVariants = internalMutation({
  args: {
    product: v.object({
      name: v.string(),
      lemonId: v.number(),
    }),
    variants: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        lemonId: v.number(),
      }),
    ),
  },
  handler: async (ctx, { product, variants }) => {
    const productRow = await ctx.db
      .query('products')
      .withIndex('by_lemon', (q) => q.eq('lemonId', product.lemonId))
      .first();
    let productId: Id<'products'>;
    if (productRow) {
      await ctx.db.patch(productRow._id, { name: product.name });
      productId = productRow._id;
    } else {
      productId = await ctx.db.insert('products', product);
    }

    for (const v of variants) {
      const existing = await ctx.db
        .query('variants')
        .withIndex('by_lemon', (q) => q.eq('lemonId', v.lemonId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: v.name,
          price: v.price,
          productId,
        });
      } else {
        await ctx.db.insert('variants', { ...v, productId });
      }
    }
  },
});

/* ------------------------------------------------------------------ */
/* LemonSqueezy HTTP helpers                                            */
/* ------------------------------------------------------------------ */

interface LemonCheckoutResponse {
  data?: { attributes?: { url?: string } };
  errors?: { detail?: string }[];
}

interface LemonVariantsResponse {
  data?: {
    id: string;
    attributes?: { name?: string; price?: number; status?: string };
  }[];
  errors?: { detail?: string }[];
}

async function createLemonCheckout(opts: {
  storeId: string;
  variantId: string;
  apiKey: string;
  email?: string | null;
  userName?: string | null;
  customData: Record<string, string>;
  variantQuantities?: { variantId: string; quantity: number }[];
  redirectUrl?: string;
  receiptLinkUrl?: string;
}): Promise<string> {
  const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: opts.email ?? undefined,
            name: opts.userName ?? undefined,
            variant_quantities: opts.variantQuantities,
            custom: opts.customData,
          },
          product_options:
            opts.redirectUrl || opts.receiptLinkUrl
              ? {
                  redirect_url: opts.redirectUrl,
                  receipt_link_url: opts.receiptLinkUrl,
                }
              : undefined,
        },
        relationships: {
          store: { data: { type: 'stores', id: opts.storeId } },
          variant: { data: { type: 'variants', id: opts.variantId } },
        },
      },
    }),
  });

  const body = (await res.json().catch(() => ({}))) as LemonCheckoutResponse;
  if (!res.ok) {
    const detail = body.errors?.[0]?.detail ?? `HTTP ${res.status}`;
    throw new ConvexError({
      code: 'internal',
      message: `LemonSqueezy checkout failed: ${detail}`,
    });
  }
  const url = body.data?.attributes?.url;
  if (!url) {
    throw new ConvexError({
      code: 'internal',
      message: 'LemonSqueezy did not return a checkout URL',
    });
  }
  return url;
}

function readEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new ConvexError({
      code: 'internal',
      message: `Missing env var: ${key}`,
    });
  }
  return v;
}

/* ------------------------------------------------------------------ */
/* Checkout creation                                                    */
/* ------------------------------------------------------------------ */

/**
 * Creates a LemonSqueezy checkout for the Plus product. Quantity is passed
 * via `variant_quantities` so the buyer can purchase multiple credits in
 * one go. Webhook (`order_created`) grants one `elections_plus` credit per
 * purchased unit.
 */
export const createPlusCheckout = action({
  args: {
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, { quantity }): Promise<{ url: string }> => {
    const qty = Math.max(1, Math.min(quantity ?? 1, 100));
    const userId = await ctx.runQuery(internal.billing.requireUserId, {});
    const user = await ctx.runQuery(internal.billing.getUserById, { userId });

    const apiKey = readEnv('LEMONSQUEEZY_API_KEY');
    const storeId = readEnv('LEMONSQUEEZY_STORE_ID');
    const variantId = readEnv('LEMONSQUEEZY_PLUS_VARIANT_ID');
    const siteUrl = process.env.SITE_URL ?? 'https://eboto.app';

    const url = await createLemonCheckout({
      apiKey,
      storeId,
      variantId,
      email: user?.email ?? null,
      userName: user?.name ?? null,
      variantQuantities: [{ variantId, quantity: qty }],
      customData: { user_id: userId, type: 'plus' },
      // Land the buyer directly on the create page. `?purchase=plus` lets the
      // page show a "Confirming purchase…" state while the webhook race
      // resolves — the reactive quota query flips it off once the credit
      // lands.
      redirectUrl: `${siteUrl}/dashboard/new?purchase=plus`,
      receiptLinkUrl: `${siteUrl}/account/billing`,
    });
    return { url };
  },
});

const boostPriceValidator = v.union(
  v.literal(49900),
  v.literal(69900),
  v.literal(89900),
  v.literal(109900),
  v.literal(129900),
);

/**
 * Creates a LemonSqueezy checkout to upgrade a specific election to a Boost
 * tier. Caller must be a commissioner of the election. The Boost variant is
 * looked up in the `variants` table by `(productId, price)` — the table
 * must be pre-seeded via `syncBoostVariants`.
 */
export const createBoostCheckout = action({
  args: {
    electionId: v.id('elections'),
    price: boostPriceValidator,
  },
  handler: async (ctx, { electionId, price }): Promise<{ url: string }> => {
    const { userId, election } = await ctx.runQuery(
      internal.billing.requireBoostContext,
      { electionId },
    );

    const apiKey = readEnv('LEMONSQUEEZY_API_KEY');
    const storeId = readEnv('LEMONSQUEEZY_STORE_ID');
    const lemonProductId = Number(readEnv('LEMONSQUEEZY_BOOST_PRODUCT_ID'));
    if (!Number.isFinite(lemonProductId)) {
      throw new ConvexError({
        code: 'internal',
        message: 'LEMONSQUEEZY_BOOST_PRODUCT_ID must be a number',
      });
    }

    const variant = await ctx.runQuery(
      internal.billing.getBoostVariantByPrice,
      { lemonProductId, price },
    );
    if (!variant) {
      throw new ConvexError({
        code: 'not_found',
        message:
          'Boost variant not found. Run `convex run billing:syncBoostVariants` to seed the variants table.',
      });
    }

    const siteUrl = process.env.SITE_URL ?? 'https://eboto.app';
    const url = await createLemonCheckout({
      apiKey,
      storeId,
      variantId: String(variant.lemonId),
      email: election.userEmail ?? null,
      userName: election.userName ?? null,
      customData: {
        user_id: userId,
        election_id: electionId,
        type: 'boost',
      },
      redirectUrl: `${siteUrl}/dashboard/${election.slug}`,
      receiptLinkUrl: `${siteUrl}/account/billing`,
    });
    return { url };
  },
});

/* ------------------------------------------------------------------ */
/* Variant sync                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fetches the Boost product's variants from LemonSqueezy and upserts them
 * into `products` + `variants`. Run from the CLI whenever variants change:
 *
 *     pnpm --filter @eboto/backend exec convex run billing:syncBoostVariants
 *
 * Idempotent — re-runs are safe.
 */
export const syncBoostVariants = internalAction({
  args: {},
  handler: async (ctx): Promise<{ synced: number }> => {
    const apiKey = readEnv('LEMONSQUEEZY_API_KEY');
    const lemonProductId = Number(readEnv('LEMONSQUEEZY_BOOST_PRODUCT_ID'));
    if (!Number.isFinite(lemonProductId)) {
      throw new ConvexError({
        code: 'internal',
        message: 'LEMONSQUEEZY_BOOST_PRODUCT_ID must be a number',
      });
    }

    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${lemonProductId}&page[size]=100`,
      {
        headers: {
          Accept: 'application/vnd.api+json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const body = (await res.json().catch(() => ({}))) as LemonVariantsResponse;

    if (!res.ok) {
      const detail = body.errors?.[0]?.detail ?? `HTTP ${res.status}`;
      throw new ConvexError({
        code: 'internal',
        message: `LemonSqueezy variant lookup failed: ${detail}`,
      });
    }

    // Keep only published Boost-tier variants — LemonSqueezy products carry
    // a "Default" variant plus pending/draft tiers (e.g. the Unlimited
    // pay-what-you-want one) that we don't want to seed.
    const variants = (body.data ?? [])
      .map((variant) => ({
        lemonId: Number(variant.id),
        name: variant.attributes?.name ?? '',
        price: Number(variant.attributes?.price ?? 0),
        status: variant.attributes?.status,
      }))
      .filter(
        (v) =>
          Number.isFinite(v.lemonId) &&
          v.status === 'published' &&
          BOOST_PRICES.includes(v.price),
      )
      .map(({ lemonId, name, price }) => ({ lemonId, name, price }));

    await ctx.runMutation(internal.billing.upsertProductWithVariants, {
      product: { name: 'Boost', lemonId: lemonProductId },
      variants,
    });

    return { synced: variants.length };
  },
});

/* ------------------------------------------------------------------ */
/* Webhook                                                              */
/* ------------------------------------------------------------------ */

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?:
      | { type: 'boost'; election_id: string; user_id: string }
      | { type: 'plus'; user_id: string };
  };
  data?: {
    attributes?: {
      first_order_item?: {
        variant_id?: number;
        quantity?: number;
        price?: number;
      };
    };
  };
}

/**
 * LemonSqueezy webhook endpoint. Mounted at
 *   POST https://<deployment>.convex.site/billing/webhook
 *
 * Verifies the HMAC-SHA256 signature against `LEMONSQUEEZY_WEBHOOK_SECRET`,
 * then dispatches on `meta.event_name`. Today we handle `order_created` for
 * type=plus (grants `elections_plus` credits) and type=boost (upgrades the
 * election using the order's `first_order_item.variant_id` and the variant's
 * tier-derived voter cap).
 */
export const lemonWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return new Response('Server misconfigured: missing webhook secret', {
      status: 500,
    });
  }

  const raw = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  const expected = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (!constantTimeEqual(signature, expected)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.meta?.event_name !== 'order_created') {
    return new Response(null, { status: 204 });
  }

  const data = payload.meta.custom_data;
  const firstItem = payload.data?.attributes?.first_order_item;
  if (!data) return new Response(null, { status: 204 });

  if (data.type === 'boost' && data.election_id && firstItem?.variant_id) {
    const variant = await ctx.runQuery(internal.billing.getVariantByLemonId, {
      lemonId: firstItem.variant_id,
    });
    const voterCap = variant
      ? BOOST_PRICE_TO_VOTER_CAP[variant.price]
      : undefined;
    if (!variant || !voterCap) {
      // Fail loud: a Boost order arrived for a variant we don't recognize, or
      // for a price we haven't mapped to a voter cap. Returning 5xx makes
      // Lemon Squeezy retry the webhook (every ~10 min for up to 3 days), so
      // updating BOOST_PRICE_TO_VOTER_CAP and replaying nothing else is
      // enough — the next retry will succeed. The console.error gives the
      // operator the order id + variant + price they need to fix the map.
      const orderRef =
        (payload.data as { id?: string | number } | undefined)?.id ??
        'unknown';
      console.error(
        '[lemonWebhook] Unresolvable Boost order — refusing to upgrade.',
        {
          orderId: orderRef,
          electionId: data.election_id,
          variantId: firstItem.variant_id,
          variantPrice: variant?.price,
          knownPrices: Object.keys(BOOST_PRICE_TO_VOTER_CAP),
        },
      );
      return new Response(
        JSON.stringify({
          error: 'unresolvable_boost_variant',
          variantId: firstItem.variant_id,
          variantPrice: variant?.price ?? null,
        }),
        { status: 503, headers: { 'content-type': 'application/json' } },
      );
    }
    await ctx.runMutation(internal.billing.upgradeElectionBoost, {
      electionId: data.election_id as Id<'elections'>,
      variantId: firstItem.variant_id,
      voterCap,
    });
  } else if (data.type === 'plus') {
    const qty = Math.max(1, firstItem?.quantity ?? 1);
    for (let i = 0; i < qty; i++) {
      await ctx.runMutation(internal.billing.grantElectionsPlus, {
        userId: data.user_id as Id<'users'>,
      });
    }
  }

  return new Response(null, { status: 204 });
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

import crypto from "crypto";
import { env } from "env.mjs";

import { db, eq } from "@eboto/db";
import { elections, elections_plus, users } from "@eboto/db/schema";

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data:
      | {
          type: "boost";
          election_id: string;
          user_id: string;
        }
      | {
          type: "plus";
          user_id: string;
        };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      identifier: string;
      order_number: number;
      user_name: string;
      user_email: string;
      currency: string;
      currency_rate: string;
      subtotal: number;
      discount_total: number;
      tax: number;
      total: number;
      subtotal_usd: number;
      discount_total_usd: number;
      tax_usd: number;
      total_usd: number;
      tax_name: string;
      tax_rate: string;
      status: string;
      status_formatted: string;
      refunded: boolean;
      refunded_at: string | null;
      subtotal_formatted: string;
      discount_total_formatted: string;
      tax_formatted: string;
      total_formatted: string;
      first_order_item: {
        id: number;
        order_id: number;
        product_id: number;
        variant_id: number;
        product_name: string;
        variant_name: string;
        price: number;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
        test_mode: boolean;
      };
      urls: {
        receipt: string;
      };
      created_at: string;
      updated_at: string;
    };
    relationships: {
      store: {
        links: {
          related: string;
          self: string;
        };
      };
      customer: {
        links: {
          related: string;
          self: string;
        };
      };
      "order-items": {
        links: {
          related: string;
          self: string;
        };
      };
      subscriptions: {
        links: {
          related: string;
          self: string;
        };
      };
      "license-keys": {
        links: {
          related: string;
          self: string;
        };
      };
      "discount-redemptions": {
        links: {
          related: string;
          self: string;
        };
      };
    };
    links: {
      self: string;
    };
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(req.headers.get("X-Signature") ?? "", "utf8");

    if (!crypto.timingSafeEqual(digest, signature)) {
      throw new Error("Invalid signature.");
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;

    switch (payload.meta.event_name) {
      case "order_created":
        await db.transaction(async (trx) => {
          if (payload.meta.custom_data.type === "boost") {
            const election = await trx.query.elections.findFirst({
              where: eq(elections.id, payload.meta.custom_data.election_id),
            });

            if (!election) {
              throw new Error("Election not found");
            }

            await trx
              .update(elections)
              .set({
                variant_id: payload.data.attributes.first_order_item.variant_id,
              })
              .where(eq(elections.id, election.id));
          } else if (payload.meta.custom_data.type === "plus") {
            const user = await trx.query.users.findFirst({
              where: eq(users.id, payload.meta.custom_data.user_id),
            });

            if (!user) {
              throw new Error("User not found");
            }

            await trx.insert(elections_plus).values({ user_id: user.id });
          }
        });

        break;
      case "order_refunded":
      case "subscription_created":
      case "subscription_cancelled":
      case "subscription_resumed":
      case "subscription_expired":
      case "subscription_paused":
      case "subscription_unpaused":
      case "subscription_payment_failed":
      case "subscription_payment_success":
      case "subscription_payment_recovered":
      default:
        throw new Error(`🤷‍♀️ Unhandled event: ${payload.meta.event_name}`);
    }
  } catch (error: unknown) {
    if (isError(error)) {
      return new Response(`Webhook error: ${error.message}`, {
        status: 400,
      });
    }

    return new Response("Webhook error", {
      status: 400,
    });
  }

  return new Response(null, {
    status: 200,
  });
}

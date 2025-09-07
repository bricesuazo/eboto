import crypto from 'crypto';
import { env } from 'env';

import { createClient } from '~/supabase/admin';

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data:
      | {
          type: 'boost';
          election_id: string;
          user_id: string;
        }
      | {
          type: 'plus';
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
        quantity: number;
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
      'order-items': {
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
      'license-keys': {
        links: {
          related: string;
          self: string;
        };
      };
      'discount-redemptions': {
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
  const supabase = createClient();
  try {
    const rawBody = await req.text();

    const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers.get('X-Signature') ?? '', 'utf8');

    if (
      !crypto.timingSafeEqual(new Uint8Array(digest), new Uint8Array(signature))
    ) {
      throw new Error('Invalid signature.');
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;

    // TODO: add transaction
    switch (payload.meta.event_name) {
      case 'order_created':
        if (payload.meta.custom_data.type === 'boost') {
          const { data: election } = await supabase
            .from('elections')
            .select()
            .eq('id', payload.meta.custom_data.election_id)
            .is('deleted_at', null)
            .single();

          if (!election) {
            throw new Error('Election not found');
          }

          await supabase
            .from('elections')
            .update({
              variant_id: payload.data.attributes.first_order_item.variant_id,
            })
            .eq('id', election.id);
        } else {
          const { data: user } = await supabase
            .from('users')
            .select()
            .eq('id', payload.meta.custom_data.user_id)
            .is('deleted_at', null)
            .single();

          if (!user) {
            throw new Error('User not found');
          }

          await supabase.from('elections_plus').insert(
            Array.from(
              { length: payload.data.attributes.first_order_item.quantity },
              () => ({
                user_id: user.id,
              }),
            ),
          );
        }

        break;
      case 'order_refunded':
      case 'subscription_created':
      case 'subscription_cancelled':
      case 'subscription_resumed':
      case 'subscription_expired':
      case 'subscription_paused':
      case 'subscription_unpaused':
      case 'subscription_payment_failed':
      case 'subscription_payment_success':
      case 'subscription_payment_recovered':
      default:
        throw new Error(`🤷‍♀️ Unhandled event: ${payload.meta.event_name}`);
    }
  } catch (error: unknown) {
    if (isError(error)) {
      return new Response(`Webhook error: ${error.message}`, {
        status: 400,
      });
    }

    return new Response('Webhook error', {
      status: 400,
    });
  }

  return new Response(null, {
    status: 200,
  });
}

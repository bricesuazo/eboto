import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@eboto-mo/db";
import { users } from "@eboto-mo/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
// import type { WebhookRequiredHeaders } from "svix";
import { Webhook } from "svix";

const webhookSecret: string = process.env.WEBHOOK_SECRET ?? "";

async function handler(req: Request) {
  const payload = (await req.json()) as Record<string, unknown>;
  const payloadString = JSON.stringify(payload);
  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixIdTimeStamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");
  if (!svixId || !svixIdTimeStamp || !svixSignature) {
    return new Response("Error occured", {
      status: 400,
    });
  }
  // Create an object of the headers
  const svixHeaders = {
    "svix-id": svixId,
    "svix-timestamp": svixIdTimeStamp,
    "svix-signature": svixSignature,
  };
  // Create a new Webhook instance with your webhook secret
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;
  try {
    // Verify the webhook payload and headers
    evt = wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (_) {
    console.log("error");
    return new Response("Error occured", {
      status: 400,
    });
  }
  const { id } = evt.data;
  // Handle the webhook
  const eventType = evt.type;

  console.log(`User ${id} was ${eventType}`);

  if (!id)
    return new Response("Error occured", {
      status: 400,
    });

  if (eventType === "user.created") {
    await db.insert(users).values({
      id,
    });
  } else if (eventType === "user.deleted") {
    await db.delete(users).where(eq(users.id, id));
  }

  return new Response("", {
    status: 201,
  });
}

export { handler as POST, handler as PUT, handler as GET };

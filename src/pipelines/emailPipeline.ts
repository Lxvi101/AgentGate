// src/pipelines/emailPipeline.ts
/* Example use of a template
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import type { AppContext } from "../core/context";
import { createShopifyClient } from "../domains/shopify/client";
import { ShopifyService } from "../domains/shopify/service";
import { getDhlTrackingStatus } from "../domains/dhl/client";

export function registerEmailPipeline(ctx: AppContext) {
  console.log("🛤️  Email Enrichment Pipeline Registered");

  ctx.bus.on("email:raw_received", async (rawEmail) => {
    console.log(`🔍 Pipeline analyzing email from ${rawEmail.from}...`);

    const google = createGoogleGenerativeAI({ apiKey: ctx.config.GOOGLE_API_KEY });
    // Using 2.0 Flash - perfect for fast, cheap, and accurate classification
    const model = google("gemini-2.0-flash-001");

    try {
      // 1. Fast Classification & Entity Extraction
      const { object } = await generateObject({
        model,
        schema: z.object({
          category: z.enum(["support", "offer", "spam"]),
          summary: z
            .string()
            .describe(
              "A 1-2 sentence ultra-short summary of what the sender wants."
            ),
          orderId: z
            .string()
            .optional()
            .describe(
              "Extract order ID if present (e.g., #1234 or 1234). Remove the '#' if present."
            ),
        }),
        prompt: `
          Analyze this incoming email.
          From: ${rawEmail.from}
          Subject: ${rawEmail.subject}
          Body: ${rawEmail.body.substring(0, 2000)}

          Categorize it. If it's a support request regarding an order, extract the order number.
        `,
      });

      // 2. Discard Spam Immediately
      if (object.category === "spam") {
        console.log(`🗑️ Pipeline dropped SPAM from ${rawEmail.from}`);
        return;
      }

      let enrichedContext = "";

      // 3. Augment Data: Shopify -> DHL
      if (object.category === "support") {
        const { shopify, session } = createShopifyClient(ctx.config);
        const service = new ShopifyService(shopify, session);

        let orders: Awaited<ReturnType<ShopifyService["searchOrders"]>> = [];

        // Search by Order ID if extracted, otherwise fallback to customer Email
        console.log(
          `📦 Fetching Shopify Context for: ${object.orderId || rawEmail.from}`
        );
        try {
          orders = await service.searchOrders(object.orderId || rawEmail.from);

          if (orders.length > 0) {
            const order = orders[0]; // Take the most relevant/recent order
            enrichedContext += `[Shopify Order Info]\nOrder Number: ${order.orderNumber}\nStatus: ${order.status}\nTotal: ${order.total}\nItems: ${order.items.join(", ")}\n`;

            // 4. Augment Data: DHL (If tracking exists)
            if (order.trackingNumber) {
              console.log(
                `🚚 Found tracking number (${order.trackingNumber}), fetching DHL status...`
              );
              enrichedContext += `Tracking Number: ${order.trackingNumber} (${order.trackingCompany || "Unknown"})\n`;

              const dhlStatus = await getDhlTrackingStatus(
                ctx,
                order.trackingNumber
              );
              if (dhlStatus) {
                enrichedContext += `\n[DHL Live Status]\n${dhlStatus}\n`;
              } else {
                enrichedContext += `\n[DHL Live Status]\nCould not fetch live tracking data.\n`;
              }
            } else {
              enrichedContext += `\n[Tracking]: No tracking number generated for this order yet.\n`;
            }
          } else {
            enrichedContext += `[Shopify Context]: Could not locate any orders matching ${object.orderId || rawEmail.from}.\n`;
          }
        } catch (err) {
          console.error("❌ Pipeline Augmentation Error (Shopify/DHL):", err);
          enrichedContext += `[System Error]: Failed to fetch external context.\n`;
        }
      }

      // 5. Hand over to Samantha (Emit actionable event)
      console.log(
        `🎯 Pipeline finished. Handing ${object.category} over to Samantha.`
      );
      ctx.bus.emit("email:actionable", {
        from: rawEmail.from,
        subject: rawEmail.subject,
        category: object.category,
        summary: object.summary,
        orderId: object.orderId,
        enrichedContext,
        conversationId: rawEmail.conversationId,
      });
    } catch (error) {
      console.error("❌ Email Pipeline Classification Failed:", error);
    }
  });
}
*/
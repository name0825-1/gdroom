export interface DiscordEmbed {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    thumbnail?: { url: string };
    image?: { url: string };
    author?: { name: string; icon_url?: string; url?: string };
    footer?: { text: string; icon_url?: string };
    timestamp?: string;
}

/**
 * Sends a message to the Discord Webhook.
 * @param content Optional raw text content
 * @param embeds Array of Discord Embed objects
 */
export async function sendDiscordWebhook(
    { content, embeds }: { content?: string; embeds?: DiscordEmbed[] }
): Promise<boolean> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn("[Discord Webhook] DISCORD_WEBHOOK_URL is not set.");
        return false;
    }

    try {
        const payload = {
            content: content || null,
            embeds: embeds || [],
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`[Discord Webhook] Failed to send message: ${response.status} ${response.statusText}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[Discord Webhook] Error sending message:", error);
        return false;
    }
}

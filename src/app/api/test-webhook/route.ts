import { NextResponse } from "next/server";
import { sendDiscordWebhook } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        
        if (!webhookUrl) {
            return NextResponse.json({ 
                error: "DISCORD_WEBHOOK_URL is missing in environment variables.",
                envKeys: Object.keys(process.env).filter(k => k.includes("DISCORD"))
            }, { status: 500 });
        }

        await sendDiscordWebhook({
            embeds: [{
                title: "🧪 Test Notification from Vercel Server",
                description: "This is a direct test from the Vercel API Route.",
                color: 0x3b82f6, // Blue-500
                timestamp: new Date().toISOString()
            }]
        });

        return NextResponse.json({ success: true, message: "Webhook sent successfully." });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || "Failed to send webhook." }, { status: 500 });
    }
}

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

        const success = await sendDiscordWebhook({
            embeds: [{
                title: "🧪 Test Notification from Vercel Server",
                description: "This is a direct test from the Vercel API Route.",
                color: 0x3b82f6, // Blue-500
                timestamp: new Date().toISOString()
            }]
        });

        if (success) {
            return NextResponse.json({ success: true, message: "Webhook sent successfully." });
        } else {
            return NextResponse.json({ success: false, error: "Failed to send webhook. Check Vercel logs." }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

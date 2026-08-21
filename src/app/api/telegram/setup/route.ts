import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8803897658:AAFW_YCLcL60RN6kritsD88qdNqyEneXjYI';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://maktab-ai-two.vercel.app';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const webhookUrl = `${APP_URL}/api/telegram/webhook`;

  if (action === 'set') {
    try {
      const res = await fetch(`${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
      const data = await res.json();
      return NextResponse.json({
        success: data.ok,
        action: 'setWebhook',
        webhookUrl,
        telegramResponse: data,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  if (action === 'delete') {
    try {
      const res = await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=false`);
      const data = await res.json();
      return NextResponse.json({
        success: data.ok,
        action: 'deleteWebhook',
        telegramResponse: data,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // Default: Get webhook info
  try {
    const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const data = await res.json();
    return NextResponse.json({
      configuredAppUrl: APP_URL,
      expectedWebhookUrl: webhookUrl,
      currentWebhookInfo: data,
      actions: {
        setWebhook: `${APP_URL}/api/telegram/setup?action=set`,
        deleteWebhook: `${APP_URL}/api/telegram/setup?action=delete`,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

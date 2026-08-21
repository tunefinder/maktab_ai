const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8803897658:AAFW_YCLcL60RN6kritsD88qdNqyEneXjYI';
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://maktab-ai-two.vercel.app';
const WEBHOOK_URL = `${APP_URL}/api/telegram/webhook`;

async function main() {
  console.log(`🌐 Setting Telegram Webhook to: ${WEBHOOK_URL}...`);
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}&drop_pending_updates=false`);
    const data = await res.json();
    console.log('Result:', data);
    if (data.ok) {
      console.log('✅ Webhook muvaffaqiyatli o\'rnatildi! Endi bot Vercel serverida 24/7 ishlaydi!');
    } else {
      console.error('❌ Xatolik:', data.description);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8803897658:AAFW_YCLcL60RN6kritsD88qdNqyEneXjYI';

async function main() {
  console.log('🔄 Deleting Telegram Webhook for local polling...');
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`);
    const data = await res.json();
    console.log('Result:', data);
    if (data.ok) {
      console.log('✅ Webhook o\'chirildi. Endi lokal polling orqali ishlatishingiz mumkin.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();

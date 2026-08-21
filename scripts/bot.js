const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8803897658:AAFW_YCLcL60RN6kritsD88qdNqyEneXjYI';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.APP_URL || 'https://maktab-ai-two.vercel.app';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '7833585964'; // @dasturchi_samar

// Karta ma'lumotlari
let PAYMENT_CARD = process.env.PAYMENT_CARD || '9860 1666 5511 7843';
let PAYMENT_CARD_HOLDER = process.env.PAYMENT_CARD_HOLDER || 'Samar Dasturchi';

// Buyurtmalar xotirasi (chatId -> order)
const userOrders = new Map();

console.log('🤖 Novda AI Telegram Bot ishga tushmoqda...');
console.log('🔑 Bot: @Novdaaibot (Token:', BOT_TOKEN.slice(0, 10) + '...)');
console.log('👑 Admin ID:', ADMIN_ID);

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateKey(prefix = 'PRO') {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${p1}-${p2}`;
}

async function sendApi(method, data) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error(`Telegram API (${method}) error response:`, json);
    }
    return json;
  } catch (err) {
    console.error(`Network error in sendApi(${method}):`, err.message);
    return null;
  }
}

async function sendMessage(chatId, text, replyMarkup = null) {
  console.log(`📤 Xabar yuborilmoqda -> Chat: ${chatId}`);
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || getReplyMenu(),
  };

  let res = await sendApi('sendMessage', payload);
  if (!res || !res.ok) {
    console.log('Retrying without HTML parse_mode...');
    payload.parse_mode = undefined;
    payload.text = text.replace(/<[^>]*>/g, '');
    res = await sendApi('sendMessage', payload);
  }
  return res;
}

async function sendPhoto(chatId, photoFileId, caption, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    photo: photoFileId,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
  };
  return await sendApi('sendPhoto', payload);
}

async function editMessageCaption(chatId, messageId, caption, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
  };
  return await sendApi('editMessageCaption', payload);
}

async function answerCallbackQuery(callbackQueryId, text = null) {
  return await sendApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text || undefined,
  });
}

// Bottom Keyboard Menu
function getReplyMenu() {
  return {
    keyboard: [
      [
        { text: '🥈 Ustoz PRO Kaliti (49 000 so\'m)' },
        { text: '🥇 Maktab VIP Kaliti (199 000 so\'m)' }
      ],
      [
        { text: '🎁 7 Kunlik Bepul Sinov Kaliti' }
      ],
      [
        { text: '📊 Tariflar va Narxlar' },
        { text: 'ℹ️ Yordam & Qo\'llanma' }
      ]
    ],
    resize_keyboard: true
  };
}

// Inline Menu
function getInlineMenu() {
  return {
    inline_keyboard: [
      [
        { text: '🥈 Ustoz PRO Kaliti (49 000 so\'m)', callback_data: 'buy_pro' }
      ],
      [
        { text: '🥇 Maktab VIP Kaliti (199 000 so\'m)', callback_data: 'buy_vip' }
      ],
      [
        { text: '🎁 7 Kunlik Bepul Sinov Kaliti', callback_data: 'free_trial' }
      ],
      [
        { text: '📊 Tariflar va Limitlar', callback_data: 'tariffs' },
        { text: 'ℹ️ Yordam & Qo\'llanma', callback_data: 'help' }
      ],
      [
        { text: '🌐 Sayt Manzili (Havola)', callback_data: 'website' }
      ]
    ]
  };
}

// Send Invoice to User with Confirmation Action
async function sendInvoice(chatId, plan, amount, durationDays) {
  userOrders.set(chatId, {
    plan,
    amount,
    durationDays,
    createdAt: Date.now()
  });

  const title = plan === 'VIP' ? 'Maktab VIP (1 oy)' : 'Ustoz PRO (1 oy)';

  const text = `
💳 <b>TO'LOV MA'LUMOTLARI:</b>

📦 <b>Tanlangan tarif:</b> ${title}
💰 <b>To'lov summasi:</b> ${amount}

💳 <b>Karta raqami:</b>
<code>${PAYMENT_CARD}</code>
<i>(Nusxalash uchun karta raqami ustiga bosing)</i>

👤 <b>Karta egasi:</b> ${PAYMENT_CARD_HOLDER}

━━━━━━━━━━━━━━━━━━━━
📸 <b>TO'LOVNI YUBORISH:</b>
1. Kartaga <b>${amount}</b> o'tkazing.
2. Quyidagi <b>"📸 Chekni ko'rsatish"</b> tugmasini bosing yoki to'lov cheki rasmini to'g'ridan-to'g'ri shu botga yuboring! ⚡
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📸 Chekni ko\'rsatish', callback_data: 'confirm_paid' }
      ],
      [
        { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

// Grant Free Trial Key (7 Days Free - 1 Time per Telegram Account)
async function grantTrialKey(chatId) {
  try {
    const existing = await pool.query(
      'SELECT * FROM "TrialClaim" WHERE "telegramId" = $1',
      [String(chatId)]
    );

    if (existing.rows.length > 0) {
      const prevKey = existing.rows[0].key;
      const alreadyText = `
⚠️ <b>DIQQAT: Siz 7 kunlik bepul sinov kalitini allaqachon olgansiz!</b>

🔑 <b>Sizning avvalgi kalitingiz:</b>
<code>${prevKey}</code>

📌 <i>Har bir Telegram hisobi faqat 1 marta bepul sinov kaliti olishi mumkin.</i>

Agar sinov muddatingiz tugagan bo'lsa, xizmatdan to'liq va cheklovlarsiz foydalanish uchun quyidagi qulay tariflardan birini faollashtiring:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🥈 Ustoz PRO Kaliti (49 000 so\'m)', callback_data: 'buy_pro' },
            { text: '🥇 Maktab VIP Kaliti (199 000 so\'m)', callback_data: 'buy_vip' }
          ],
          [
            { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
          ]
        ]
      };

      await sendMessage(chatId, alreadyText.trim(), keyboard);
      return;
    }

    const key = generateKey('PRO');

    await prisma.licenseKey.create({
      data: {
        key: key,
        plan: 'PRO',
        durationDays: 7,
        isUsed: false
      }
    });

    await pool.query(
      'INSERT INTO "TrialClaim" ("telegramId", "key") VALUES ($1, $2)',
      [String(chatId), key]
    );

    console.log(`🎁 Yangi 7 kunlik Sinov PRO kaliti berildi: ${key} -> Chat: ${chatId}`);

    const text = `
🎉 <b>Tabriklaymiz! 7 kunlik Bepul Sinov kalitingiz tayyor!</b>

🔑 <b>Sizning kalitingiz:</b>
<code>${key}</code>
<i>(Nusxalash uchun kod ustiga bosing)</i>

⏳ <b>Amal qilish muddati:</b> 7 kun
📊 <b>Imkoniyatlar:</b> 6 ta sinf, 200 ta o'quvchi, 1 000 ta daftar, 100 ta test

📲 <b>Faollashtirish uchun:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. Kalitni joylashtirib, <b>"Faollashtirish"</b> tugmasini bosing!
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🥈 Ustoz PRO Kaliti (49 000 so\'m)', callback_data: 'buy_pro' },
          { text: '🥇 Maktab VIP Kaliti (199 000 so\'m)', callback_data: 'buy_vip' }
        ],
        [
          { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
        ]
      ]
    };

    await sendMessage(chatId, text.trim(), keyboard);
  } catch (err) {
    console.error("Error creating trial key:", err);
    await sendMessage(chatId, "❌ Kalit yaratishda xatolik yuz berdi.");
  }
}

// Admin approves payment -> Creates and sends key to customer
async function approvePayment(adminChatId, messageId, customerChatId, plan, durationDays) {
  const key = generateKey(plan);

  try {
    await prisma.licenseKey.create({
      data: {
        key: key,
        plan: plan,
        durationDays: Number(durationDays),
        isUsed: false
      }
    });

    console.log(`✅ To'lov tasdiqlandi! Kalit yaratildi: ${key} (${plan})`);

    // 1. Send key to Customer
    const title = plan === 'VIP' ? '👑 Maktab VIP (1 oy)' : '🥈 Ustoz PRO (1 oy)';
    const limits = plan === 'VIP'
      ? 'Cheksiz sinflar va o\'quvchilar, 15 000 ta daftar, to\'liq maktab tahlili'
      : '6 ta sinf, 200 ta o\'quvchi, 1 000 ta daftar, 100 ta AI test';

    const customerText = `
🎉 <b>TO'LOVINGIZ TASDIQLANDI!</b>

Sizning <b>${title}</b> litsenziya kalitingiz muvaffaqiyatli faollashtirish uchun tayyor:

🔑 <b>Sizning litsenziya kalitingiz:</b>
<code>${key}</code>
<i>(Nusxalash uchun kod ustiga bosing)</i>

⏳ <b>Muddati:</b> ${durationDays} kun
📊 <b>Imkoniyatlar:</b> ${limits}

📲 <b>Faollashtirish bo'yicha yo'riqnoma:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. <b>"Telegram Bot orqali olingan kalit bormi?"</b> bo'limiga ushbu kalitni kiriting.
3. <b>"Faollashtirish"</b> tugmasini bosing! 🚀
    `;

    await sendMessage(customerChatId, customerText.trim());

    // 2. Update Admin message
    const adminCaption = `✅ <b>TO'LOV TASDIQLANDI VA KALIT YUBORILDI!</b>\n\n👤 <b>Foydalanuvchi:</b> <code>${customerChatId}</code>\n📦 <b>Tarif:</b> ${plan}\n🔑 <b>Berilgan kalit:</b> <code>${key}</code>`;
    await editMessageCaption(adminChatId, messageId, adminCaption);
    userOrders.delete(customerChatId);
  } catch (err) {
    console.error("Error approving payment:", err);
    await sendMessage(adminChatId, `❌ Xatolik yuz berdi: ${err.message}`);
  }
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const rawText = msg.text || '';
  const text = rawText.trim();
  const firstName = escapeHtml(msg.from?.first_name || 'Ustoz');
  const username = msg.from?.username ? `@${msg.from.username}` : 'mavjud emas';

  // Admin buyruqlari (ID: 7833585964)
  if (String(chatId) === String(ADMIN_ID)) {
    if (text === '/admin') {
      try {
        const totalKeys = await prisma.licenseKey.count();
        const usedKeys = await prisma.licenseKey.count({ where: { isUsed: true } });
        const freeKeys = totalKeys - usedKeys;
        const totalUsers = await prisma.user.count();

        const adminStats = `
👑 <b>ADMIN BOSHQARUV PANELI</b>

👥 <b>Jami ro'yxatdan o'tganlar:</b> ${totalUsers} ta
🔑 <b>Jami yaratilgan kalitlar:</b> ${totalKeys} ta
✅ <b>Ishlatilgan kalitlar:</b> ${usedKeys} ta
🆓 <b>Faol (kutayotgan) kalitlar:</b> ${freeKeys} ta

💳 <b>Joriy to'lov kartasi:</b> 
<code>${PAYMENT_CARD}</code> (${PAYMENT_CARD_HOLDER})

📌 <b>Tezkor Admin buyruqlari:</b>
• <code>/gen pro</code> — Yangi PRO kalit generatsiya qilish
• <code>/gen vip</code> — Yangi VIP kalit generatsiya qilish
• <code>/setcard 8600... Ism</code> — Karta raqamini almashtirish
        `;
        await sendMessage(chatId, adminStats.trim());
      } catch (err) {
        console.error("Admin stats error:", err);
      }
      return;
    }

    if (text.startsWith('/gen pro')) {
      const key = generateKey('PRO');
      await prisma.licenseKey.create({
        data: { key, plan: 'PRO', durationDays: 30, isUsed: false }
      });
      await sendMessage(chatId, `✅ <b>Yangi Ustoz PRO kaliti yaratildi:</b>\n<code>${key}</code>\n⏳ Muddati: 30 kun`);
      return;
    }

    if (text.startsWith('/gen vip')) {
      const key = generateKey('VIP');
      await prisma.licenseKey.create({
        data: { key, plan: 'VIP', durationDays: 30, isUsed: false }
      });
      await sendMessage(chatId, `👑 <b>Yangi Maktab VIP kaliti yaratildi:</b>\n<code>${key}</code>\n⏳ Muddati: 30 kun`);
      return;
    }

    // Admin karta o'zgartirish buyrug'i: /setcard 8600... Ism Familiya
    if (text.startsWith('/setcard')) {
      const parts = text.split(' ').slice(1);
      if (parts.length >= 2) {
        PAYMENT_CARD = parts[0];
        PAYMENT_CARD_HOLDER = parts.slice(1).join(' ');
        await sendMessage(chatId, `✅ Karta yangilandi:\n💳 <b>${PAYMENT_CARD}</b>\n👤 <b>${PAYMENT_CARD_HOLDER}</b>`);
      } else {
        await sendMessage(chatId, `Format: <code>/setcard 8600123456789012 Ism Familiya</code>`);
      }
      return;
    }
  }

  // Handle Photo (Receipt upload)
  if (msg.photo && msg.photo.length > 0) {
    const highestPhoto = msg.photo[msg.photo.length - 1];
    const order = userOrders.get(chatId) || { plan: 'PRO', amount: '49 000 so\'m', durationDays: 30 };

    console.log(`📸 Chek qabul qilindi [${chatId}], adminga (${ADMIN_ID}) yo'naltirilmoqda...`);

    const adminCaption = `
🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>

👤 <b>Mijoz:</b> ${firstName} (${username})
🆔 <b>Chat ID:</b> <code>${chatId}</code>
📦 <b>Tarif:</b> ${order.plan} (${order.amount})
⏳ <b>Muddati:</b> ${order.durationDays} kun

👇 <i>To'lov hisobingizga tushganini tekshirib, tasdiqlang:</i>
    `;

    const adminKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ To\'lovni tasdiqlash va Kalit berish', callback_data: `approve_${chatId}_${order.plan}_${order.durationDays}` }
        ]
      ]
    };

    // Forward receipt to Admin
    await sendPhoto(ADMIN_ID, highestPhoto.file_id, adminCaption.trim(), adminKeyboard);

    // Notify customer
    const userConfirm = `
⏳ <b>To'lov chekingiz qabul qilindi!</b>

Chekingiz tekshirish uchun adminga yuborildi. 
Admin to'lovni tasdiqlashi bilan bot sizga <b>litsenziya kalitini</b> avtomatik yuboradi (odatda 1-3 daqiqa ichida). 🚀
    `;
    await sendMessage(chatId, userConfirm.trim());
    return;
  }

  if (text.startsWith('/start')) {
    const welcome = `
👋 <b>Assalomu alaykum, ${firstName}!</b>

🤖 <b>Novda AI (MaktabAI)</b> rasmiy litsenziya va to'lov botiga xush kelibsiz!

Ushbu bot orqali siz:
🔑 <b>Ustoz PRO</b> va <b>Maktab VIP</b> litsenziya kalitlarini sotib olishingiz
📊 Barcha tariflar va imkoniyatlar bilan tanishishingiz
🎁 <b>7 kunlik bepul sinov kalitini</b> olishingiz mumkin.

👇 <i>Quyidagi menyudan kerakli bo'limni tanlang:</i>
    `;
    await sendMessage(chatId, welcome.trim(), getInlineMenu());
    return;
  }

  if (text.includes('PRO Kalit') || text === '/pro') {
    await sendInvoice(chatId, 'PRO', "49 000 so'm", 30);
    return;
  }

  if (text.includes('VIP Kalit') || text === '/vip') {
    await sendInvoice(chatId, 'VIP', "199 000 so'm", 30);
    return;
  }

  if (text.includes('Sinov') || text.includes('Bepul') || text === '/trial') {
    await grantTrialKey(chatId);
    return;
  }

  if (text.includes('Tariflar') || text === '/tariffs') {
    await sendTariffs(chatId);
    return;
  }

  if (text.includes('Yordam') || text === '/help') {
    await sendHelp(chatId);
    return;
  }

  // Default fallback message
  await sendMessage(
    chatId,
    `Kerakli amalni tanlash uchun quyidagi menyudan foydalaning:`,
    getInlineMenu()
  );
}

async function sendTariffs(chatId) {
  const text = `
📊 <b>NOVDA AI (MAKTABAI) TARIFLAR TIZIMI</b>

🥉 <b>1. BEPUL (Start):</b>
• 1 ta sinf va 25 ta o'quvchi
• Oyiga 20 ta daftar tekshirish
• Oyiga 3 ta test va dars rejasi
• Narxi: <b>0 so'm</b>

🥈 <b>2. USTOZ PRO (Eng ommabop):</b>
• <b>6 ta sinf</b> va <b>200 ta o'quvchi</b>
• <b>1 000 ta daftar</b> tekshirish (AI)
• <b>100 ta AI test</b> va dars rejasi
• Kitob va daftardan suratga olib tekshirish
• PDF va Excel hisobotlarni yuklab olish
• Narxi: <b>49 000 so'm / oy</b>

🥇 <b>3. MAKTAB VIP:</b>
• <b>Cheksiz sinflar</b> va o'quvchilar
• <b>15 000 ta daftar</b> tekshirish
• Cheksiz AI testlar va dars rejalari
• To'liq maktab tahlili va reytingi
• 24/7 shaxsiy menejer ko'magi
• Narxi: <b>199 000 so'm / oy</b>
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🥈 Ustoz PRO Kalitini Olish (49 000 so\'m)', callback_data: 'buy_pro' }
      ],
      [
        { text: '🥇 Maktab VIP Kalitini Olish (199 000 so\'m)', callback_data: 'buy_vip' }
      ],
      [
        { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

async function sendHelp(chatId) {
  const text = `
ℹ️ <b>QO'LLANMA: Kalitni qanday sotib olasiz va faollashtirasiz?</b>

1️⃣ Botdan <b>"Ustoz PRO"</b> yoki <b>"Maktab VIP"</b> ni tanlang.
2️⃣ Ko'rsatilgan karta raqamiga to'lov qilib, chek rasmini botga yuboring.
3️⃣ Admin to'lovni tasdiqlagach, bot sizga <code>PRO-XXXX-YYYY</code> kalitini yuboradi.
4️⃣ Saytga kiring: <b>${APP_URL}/pricing</b>
5️⃣ Kalitni kiritib, <b>"Faollashtirish"</b> tugmasini bosing — hisobingiz darhol PRO/VIP ga aylanadi! 🎉

🌐 Sayt: <b>${APP_URL}</b>
Savollaringiz bo'lsa, @Novdaaibot orqali murojaat qiling.
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🥈 Ustoz PRO Kaliti', callback_data: 'buy_pro' },
        { text: '🥇 Maktab VIP Kaliti', callback_data: 'buy_vip' }
      ],
      [
        { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

async function handleCallback(query) {
  const callbackId = query.id;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  console.log(`🔘 Tugma bosildi [${chatId}]: "${data}"`);
  await answerCallbackQuery(callbackId);

  if (data === 'main_menu') {
    await sendMessage(chatId, `👇 <b>Asosiy Menyu:</b>`, getInlineMenu());
    return;
  }

  if (data === 'tariffs') {
    await sendTariffs(chatId);
    return;
  }

  if (data === 'help') {
    await sendHelp(chatId);
    return;
  }

  if (data === 'website') {
    await sendMessage(chatId, `🌐 <b>MaktabAI Veb-platformasi:</b>\n\n👉 <a href="${APP_URL}">${APP_URL}</a>\n👉 Tariflar va Faollashtirish: <a href="${APP_URL}/pricing">${APP_URL}/pricing</a>`);
    return;
  }

  if (data === 'buy_pro') {
    await sendInvoice(chatId, 'PRO', "49 000 so'm", 30);
    return;
  }

  if (data === 'free_trial') {
    await grantTrialKey(chatId);
    return;
  }

  if (data === 'buy_vip') {
    await sendInvoice(chatId, 'VIP', "199 000 so'm", 30);
    return;
  }

  if (data === 'confirm_paid') {
    const text = `
📸 <b>Chekni ko'rsatish (yuborish):</b>

Iltimos, kartaga o'tkazilgan <b>to'lov chekining skrinshotini yoki rasmini</b> to'g'ridan-to'g'ri shu chatga yuboring.

Chek kelishi bilan adminga yuboriladi va hisobingiz uchun litsenziya kaliti chiqariladi! ⚡
    `;
    await sendMessage(chatId, text.trim());
    return;
  }

  // Admin Actions: approve_CHATID_PLAN_DAYS
  if (data.startsWith('approve_')) {
    const parts = data.split('_');
    const targetChatId = parts[1];
    const plan = parts[2];
    const days = parts[3];
    await approvePayment(chatId, messageId, targetChatId, plan, days);
    return;
  }
}

// Telegram Long Polling Loop
let lastUpdateId = 0;

async function startPolling() {
  console.log('✅ Novda AI Telegram to\'lov boti muvaffaqiyatli ishga tushdi va xabarlarni tinglamoqda!');

  while (true) {
    try {
      const url = `${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          try {
            if (update.message) {
              await handleMessage(update.message);
            } else if (update.callback_query) {
              await handleCallback(update.callback_query);
            }
          } catch (msgErr) {
            console.error('Error handling update:', msgErr);
          }
        }
      } else if (!data.ok) {
        console.error('getUpdates returned not ok:', data);
      }
    } catch (err) {
      console.error('Polling xatosi, 3 soniyadan keyin qayta uriniladi:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startPolling().catch((err) => {
  console.error('Fatal bot error:', err);
  setTimeout(startPolling, 5000);
});

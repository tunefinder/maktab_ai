import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8803897658:AAFW_YCLcL60RN6kritsD88qdNqyEneXjYI';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://maktab-ai-two.vercel.app';
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || '7833585964'; // @dasturchi_samar

const PAYMENT_CARD = process.env.PAYMENT_CARD || '9860 1666 5511 7843';
const PAYMENT_CARD_HOLDER = process.env.PAYMENT_CARD_HOLDER || 'Samar Dasturchi';

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateKey(prefix = 'PRO'): string {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${p1}-${p2}`;
}

async function sendApi(method: string, data: any) {
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
  } catch (err: any) {
    console.error(`Network error in sendApi(${method}):`, err.message);
    return null;
  }
}

function getReplyMenu() {
  return {
    keyboard: [
      [
        { text: "🥈 Ustoz PRO Kaliti (49 000 so'm)" },
        { text: "🥇 Maktab VIP Kaliti (199 000 so'm)" }
      ],
      [
        { text: "🎁 7 Kunlik Bepul Sinov Kaliti" }
      ],
      [
        { text: "📊 Tariflar va Narxlar" },
        { text: "ℹ️ Yordam & Qo'llanma" }
      ]
    ],
    resize_keyboard: true
  };
}

function getInlineMenu() {
  return {
    inline_keyboard: [
      [
        { text: "🥈 Ustoz PRO Kaliti (49 000 so'm)", callback_data: 'buy_pro' }
      ],
      [
        { text: "🥇 Maktab VIP Kaliti (199 000 so'm)", callback_data: 'buy_vip' }
      ],
      [
        { text: "🎁 7 Kunlik Bepul Sinov Kaliti", callback_data: 'free_trial' }
      ],
      [
        { text: "📊 Tariflar va Limitlar", callback_data: 'tariffs' },
        { text: "ℹ️ Yordam & Qo'llanma", callback_data: 'help' }
      ],
      [
        { text: "🌐 Sayt Manzili (Havola)", callback_data: 'website' }
      ]
    ]
  };
}

async function sendMessage(chatId: string | number, text: string, replyMarkup: any = null) {
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || getReplyMenu(),
  };

  let res = await sendApi('sendMessage', payload);
  if (!res || !res.ok) {
    payload.parse_mode = undefined;
    payload.text = text.replace(/<[^>]*>/g, '');
    res = await sendApi('sendMessage', payload);
  }
  return res;
}

async function sendPhoto(chatId: string | number, photoFileId: string, caption: string, replyMarkup: any = null) {
  const payload: any = {
    chat_id: chatId,
    photo: photoFileId,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
  };
  return await sendApi('sendPhoto', payload);
}

async function editMessageCaption(chatId: string | number, messageId: number, caption: string, replyMarkup: any = null) {
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    caption: caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup || undefined,
  };
  return await sendApi('editMessageCaption', payload);
}

async function answerCallbackQuery(callbackQueryId: string, text: string | null = null) {
  return await sendApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text || undefined,
  });
}

async function sendInvoice(chatId: string | number, plan: 'PRO' | 'VIP', amount: string, durationDays: number) {
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
📸 <b>TO'LOVNI TASDIQLASH:</b>
1. Kartaga <b>${amount}</b> o'tkazing.
2. Quyidagi <b>"📸 Chekni ko'rsatish"</b> tugmasini bosing yoki to'lov cheki rasmini (skrinshotini) to'g'ridan-to'g'ri shu botga yuboring! ⚡
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📸 Chekni ko'rsatish", callback_data: 'confirm_paid' }
      ],
      [
        { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

async function grantTrialKey(chatId: string | number) {
  try {
    const existing = await db.trialClaim.findUnique({
      where: { telegramId: String(chatId) }
    });

    if (existing) {
      const alreadyText = `
⚠️ <b>DIQQAT: Siz 7 kunlik bepul sinov kalitini allaqachon olgansiz!</b>

🔑 <b>Sizning avvalgi kalitingiz:</b>
<code>${existing.key}</code>

📌 <i>Har bir Telegram hisobi faqat 1 marta bepul sinov kaliti olishi mumkin.</i>

Agar sinov muddatingiz tugagan bo'lsa, xizmatdan to'liq va cheklovlarsiz foydalanish uchun quyidagi qulay tariflardan birini faollashtiring:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🥈 Ustoz PRO Kaliti (49 000 so'm)", callback_data: 'buy_pro' },
            { text: "🥇 Maktab VIP Kaliti (199 000 so'm)", callback_data: 'buy_vip' }
          ],
          [
            { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
          ]
        ]
      };

      await sendMessage(chatId, alreadyText.trim(), keyboard);
      return;
    }

    const key = generateKey('PRO');

    await db.licenseKey.create({
      data: {
        key: key,
        plan: 'PRO',
        durationDays: 7,
        isUsed: false
      }
    });

    await db.trialClaim.create({
      data: {
        telegramId: String(chatId),
        key: key
      }
    });

    const text = `
🎉 <b>Tabriklaymiz! 7 kunlik Bepul Sinov kalitingiz tayyor!</b>

🔑 <b>Sizning kalitingiz:</b>
<code>${key}</code>
<i>(Nusxalash uchun kod ustiga bosing)</i>

⏳ <b>Amal qilish muddati:</b> 7 kun
📊 <b>Imkoniyatlar:</b> 6 ta sinf, 200 ta o'quvchi, 1 000 ta daftar, 100 ta test

📲 <b>Faollashtirish uchun:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. Kalitni joylashtirib, <b>"Faollashtirish"</b> tugmasini bosing! 🚀
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🥈 Ustoz PRO Kaliti (49 000 so'm)", callback_data: 'buy_pro' },
          { text: "🥇 Maktab VIP Kaliti (199 000 so'm)", callback_data: 'buy_vip' }
        ],
        [
          { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
        ]
      ]
    };

    await sendMessage(chatId, text.trim(), keyboard);
  } catch (err: any) {
    console.error("Error creating trial key in webhook:", err);
    await sendMessage(chatId, "❌ Kalit yaratishda xatolik yuz berdi.");
  }
}

async function approvePayment(adminChatId: string | number, messageId: number, customerChatId: string | number, plan: string, durationDays: number | string) {
  const days = Number(durationDays) || 30;
  const key = generateKey(plan);

  try {
    await db.licenseKey.create({
      data: {
        key: key,
        plan: plan,
        durationDays: days,
        isUsed: false
      }
    });

    const title = plan === 'VIP' ? '👑 Maktab VIP (1 oy)' : '🥈 Ustoz PRO (1 oy)';
    const limits = plan === 'VIP'
      ? "Cheksiz sinflar va o'quvchilar, 15 000 ta daftar, to'liq maktab tahlili"
      : "6 ta sinf, 200 ta o'quvchi, 1 000 ta daftar, 100 ta AI test";

    const customerText = `
🎉 <b>TO'LOVINGIZ TASDIQLANDI!</b>

Sizning <b>${title}</b> litsenziya kalitingiz muvaffaqiyatli tayyorlandi:

🔑 <b>Sizning litsenziya kalitingiz:</b>
<code>${key}</code>
<i>(Nusxalash uchun kod ustiga bosing)</i>

⏳ <b>Muddati:</b> ${days} kun
📊 <b>Imkoniyatlar:</b> ${limits}

📲 <b>Faollashtirish bo'yicha yo'riqnoma:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. <b>"Telegram Bot orqali olingan kalit bormi?"</b> bo'limiga ushbu kalitni kiriting.
3. <b>"Faollashtirish"</b> tugmasini bosing! 🚀
    `;

    await sendMessage(customerChatId, customerText.trim());

    const adminCaption = `✅ <b>TO'LOV TASDIQLANDI VA KALIT YUBORILDI!</b>\n\n👤 <b>Foydalanuvchi:</b> <code>${customerChatId}</code>\n📦 <b>Tarif:</b> ${plan}\n🔑 <b>Berilgan kalit:</b> <code>${key}</code>`;
    await editMessageCaption(adminChatId, messageId, adminCaption);
  } catch (err: any) {
    console.error("Error approving payment:", err);
    await sendMessage(adminChatId, `❌ Xatolik yuz berdi: ${err.message}`);
  }
}

async function sendTariffs(chatId: string | number) {
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
        { text: "🥈 Ustoz PRO Kalitini Olish (49 000 so'm)", callback_data: 'buy_pro' }
      ],
      [
        { text: "🥇 Maktab VIP Kalitini Olish (199 000 so'm)", callback_data: 'buy_vip' }
      ],
      [
        { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

async function sendHelp(chatId: string | number) {
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
        { text: "🥈 Ustoz PRO Kaliti", callback_data: 'buy_pro' },
        { text: "🥇 Maktab VIP Kaliti", callback_data: 'buy_vip' }
      ],
      [
        { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
      ]
    ]
  };

  await sendMessage(chatId, text.trim(), keyboard);
}

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const rawText = msg.text || '';
  const text = rawText.trim();
  const firstName = escapeHtml(msg.from?.first_name || 'Ustoz');
  const username = msg.from?.username ? `@${msg.from.username}` : 'mavjud emas';

  // Admin commands (ID: 7833585964)
  if (String(chatId) === String(ADMIN_ID)) {
    if (text === '/admin') {
      try {
        const totalKeys = await db.licenseKey.count();
        const usedKeys = await db.licenseKey.count({ where: { isUsed: true } });
        const freeKeys = totalKeys - usedKeys;
        const totalUsers = await db.user.count();

        const adminStats = `
👑 <b>ADMIN BOSHQARUV PANELI (24/7 Webhook)</b>

👥 <b>Jami ro'yxatdan o'tganlar:</b> ${totalUsers} ta
🔑 <b>Jami yaratilgan kalitlar:</b> ${totalKeys} ta
✅ <b>Ishlatilgan kalitlar:</b> ${usedKeys} ta
🆓 <b>Faol (kutayotgan) kalitlar:</b> ${freeKeys} ta

💳 <b>Joriy to'lov kartasi:</b> 
<code>${PAYMENT_CARD}</code> (${PAYMENT_CARD_HOLDER})

📌 <b>Tezkor Admin buyruqlari:</b>
• <code>/gen pro</code> — Yangi PRO kalit generatsiya qilish
• <code>/gen vip</code> — Yangi VIP kalit generatsiya qilish
        `;
        await sendMessage(chatId, adminStats.trim());
      } catch (err) {
        console.error("Admin stats error:", err);
      }
      return;
    }

    if (text.startsWith('/gen pro')) {
      const key = generateKey('PRO');
      await db.licenseKey.create({
        data: { key, plan: 'PRO', durationDays: 30, isUsed: false }
      });
      await sendMessage(chatId, `✅ <b>Yangi Ustoz PRO kaliti yaratildi:</b>\n<code>${key}</code>\n⏳ Muddati: 30 kun`);
      return;
    }

    if (text.startsWith('/gen vip')) {
      const key = generateKey('VIP');
      await db.licenseKey.create({
        data: { key, plan: 'VIP', durationDays: 30, isUsed: false }
      });
      await sendMessage(chatId, `👑 <b>Yangi Maktab VIP kaliti yaratildi:</b>\n<code>${key}</code>\n⏳ Muddati: 30 kun`);
      return;
    }
  }

  // Handle Photo (Receipt upload)
  if (msg.photo && msg.photo.length > 0) {
    const highestPhoto = msg.photo[msg.photo.length - 1];

    const adminCaption = `
🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>

👤 <b>Mijoz:</b> ${firstName} (${username})
🆔 <b>Chat ID:</b> <code>${chatId}</code>

👇 <i>To'lov hisobingizga tushganini tekshirib, tegishli tarif kalitini tasdiqlang:</i>
    `;

    const adminKeyboard = {
      inline_keyboard: [
        [
          { text: "🥈 PRO Kalit berish (49 000)", callback_data: `approve_${chatId}_PRO_30` },
          { text: "🥇 VIP Kalit berish (199 000)", callback_data: `approve_${chatId}_VIP_30` }
        ],
        [
          { text: "❌ Rad etish", callback_data: `reject_${chatId}` }
        ]
      ]
    };

    await sendPhoto(ADMIN_ID, highestPhoto.file_id, adminCaption.trim(), adminKeyboard);

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

  // Fallback
  await sendMessage(
    chatId,
    `Kerakli amalni tanlash uchun quyidagi menyudan foydalaning:`,
    getInlineMenu()
  );
}

async function handleCallback(query: any) {
  const callbackId = query.id;
  const chatId = query.message?.chat?.id;
  const messageId = query.message?.message_id;
  const data = query.data;

  await answerCallbackQuery(callbackId);

  if (!chatId) return;

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

  if (data.startsWith('approve_')) {
    const parts = data.split('_');
    const targetChatId = parts[1];
    const plan = parts[2];
    const days = parts[3];
    await approvePayment(chatId, messageId, targetChatId, plan, days);
    return;
  }

  if (data.startsWith('reject_')) {
    const parts = data.split('_');
    const targetChatId = parts[1];
    await sendMessage(targetChatId, `❌ <b>To'lovingiz tasdiqlanmadi.</b>\nIltimos, chek to'g'ri yuborilganligini tekshiring yoki adminga murojaat qiling.`);
    await editMessageCaption(chatId, messageId, `❌ <b>TO'LOV RAD ETILDI</b>\n👤 Foydalanuvchi: <code>${targetChatId}</code>`);
    return;
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook POST error:", err);
    return NextResponse.json({ ok: true, error: err.message }, { status: 200 }); // Return 200 to Telegram so it doesn't repeatedly retry on minor format issues
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: 'active',
    service: 'Novda AI Telegram Webhook',
    timestamp: new Date().toISOString()
  });
}

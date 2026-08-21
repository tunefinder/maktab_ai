import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import crypto from 'crypto';
import { PLANS, AI_PACKS, PlanType, AiPackType } from '@/utils/aiConfig';

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
        { text: "🥉 START (39 000)" },
        { text: "🥈 PRO (69 000) ⭐" },
        { text: "💎 MAX (119 000)" }
      ],
      [
        { text: "🏫 MAKTAB PRO (229 000)" },
        { text: "👑 MAKTAB VIP (399 000)" }
      ],
      [
        { text: "⚡ Qo'shimcha AI Paketlar" },
        { text: "🎁 7 Kunlik Bepul Sinov" }
      ],
      [
        { text: "📊 Barcha Tariflar" },
        { text: "ℹ️ Qo'llanma & Yordam" }
      ]
    ],
    resize_keyboard: true
  };
}

function getInlineMenu() {
  return {
    inline_keyboard: [
      [
        { text: "🥉 START (39 000 so'm)", callback_data: 'buy_START' },
        { text: "🥈 PRO (69 000 so'm) ⭐", callback_data: 'buy_PRO' }
      ],
      [
        { text: "💎 MAX (119 000 so'm)", callback_data: 'buy_MAX' },
        { text: "🏫 MAKTAB PRO (229 000)", callback_data: 'buy_MAKTAB_PRO' }
      ],
      [
        { text: "👑 MAKTAB VIP (399 000 so'm)", callback_data: 'buy_MAKTAB_VIP' }
      ],
      [
        { text: "⚡ AI Pack 500 (29 000)", callback_data: 'buy_PACK_500' },
        { text: "⚡ AI Pack 1000 (49 000)", callback_data: 'buy_PACK_1000' }
      ],
      [
        { text: "🎁 7 Kunlik Bepul Sinov Kaliti", callback_data: 'free_trial' }
      ],
      [
        { text: "📊 Tariflar va Limitlar", callback_data: 'tariffs' },
        { text: "ℹ️ Qo'llanma", callback_data: 'help' }
      ],
      [
        { text: "🌐 Saytga o'tish (Havola)", callback_data: 'website' }
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

async function sendInvoice(chatId: string | number, itemKey: string) {
  let title = "Ustoz PRO";
  let amount = "69 000 so'm";
  let description = "1 000 ta AI tekshirish, 6 ta sinf, 100 ta dars va test";

  if (itemKey === 'START') {
    title = "START (30 kun)";
    amount = "39 000 so'm";
    description = "300 ta AI tekshirish, 2 ta sinf, 40 ta dars, 30 ta test";
  } else if (itemKey === 'PRO') {
    title = "🥈 USTOZ PRO (30 kun) ⭐";
    amount = "69 000 so'm";
    description = "1 000 ta AI tekshirish, 6 ta sinf, 100 ta dars, 100 ta test";
  } else if (itemKey === 'MAX') {
    title = "💎 USTOZ MAX (30 kun)";
    amount = "119 000 so'm";
    description = "2 000 ta AI tekshirish, 15 ta sinf, 300 ta dars, 300 ta test";
  } else if (itemKey === 'MAKTAB_PRO') {
    title = "🏫 MAKTAB PRO (30 kun)";
    amount = "229 000 so'm";
    description = "4 000 ta AI tekshirish, 50 ta sinf, 1 000 ta dars va test, 5 ta o'qituvchi";
  } else if (itemKey === 'MAKTAB_VIP') {
    title = "👑 MAKTAB VIP (30 kun)";
    amount = "399 000 so'm";
    description = "6 500 ta AI tekshirish, Cheksiz sinflar va darslar, 15 ta o'qituvchi";
  } else if (itemKey === 'PACK_500') {
    title = "⚡ AI PACK 500";
    amount = "29 000 so'm";
    description = "+500 ta qo'shimcha AI tekshirish";
  } else if (itemKey === 'PACK_1000') {
    title = "⚡ AI PACK 1000";
    amount = "49 000 so'm";
    description = "+1 000 ta qo'shimcha AI tekshirish";
  }

  const text = `
💳 <b>TO'LOV MA'LUMOTLARI:</b>

📦 <b>Tanlangan:</b> ${title}
💰 <b>To'lov summasi:</b> <b>${amount}</b>
📋 <b>Imkoniyatlar:</b> ${description}

💳 <b>Karta raqami:</b>
<code>${PAYMENT_CARD}</code>
<i>(Nusxalash uchun karta raqami ustiga bosing)</i>

👤 <b>Karta egasi:</b> ${PAYMENT_CARD_HOLDER}

━━━━━━━━━━━━━━━━━━━━
📸 <b>TO'LOVNI TASDIQLASH:</b>
1. Kartaga <b>${amount}</b> o'tkazing.
2. Quyidagi <b>"📸 Chekni ko'rsatish"</b> tugmasini bosing yoki to'lov cheki skrinshotini to'g'ridan-to'g'ri shu chatga yuboring! ⚡
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📸 Chekni ko'rsatish", callback_data: `confirm_paid_${itemKey}` }
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

Xizmatdan to'liq va cheklovlarsiz foydalanish uchun quyidagi qulay tariflardan birini tanlang:
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🥉 START (39 000)", callback_data: 'buy_START' },
            { text: "🥈 PRO (69 000) ⭐", callback_data: 'buy_PRO' }
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
📊 <b>Imkoniyatlar:</b> 1 000 ta AI tekshirish, 6 ta sinf, 100 ta dars va test

📲 <b>Faollashtirish uchun:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. Kalitni joylashtirib, <b>"Faollashtirish"</b> tugmasini bosing! 🚀
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🥈 Ustoz PRO Kaliti (69 000 so'm)", callback_data: 'buy_PRO' }
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

async function approvePayment(adminChatId: string | number, messageId: number, customerChatId: string | number, itemKey: string) {
  try {
    let keyPrefix = itemKey;
    let creditsBonus = 0;
    let durationDays = 30;
    let title = "Ustoz PRO (30 kun)";

    if (itemKey === 'START') {
      keyPrefix = 'START';
      title = '🥉 START (30 kun)';
    } else if (itemKey === 'PRO') {
      keyPrefix = 'PRO';
      title = '🥈 Ustoz PRO (30 kun)';
    } else if (itemKey === 'MAX') {
      keyPrefix = 'MAX';
      title = '💎 Ustoz MAX (30 kun)';
    } else if (itemKey === 'MAKTAB_PRO') {
      keyPrefix = 'MKPRO';
      title = '🏫 Maktab PRO (30 kun)';
    } else if (itemKey === 'MAKTAB_VIP') {
      keyPrefix = 'MKVIP';
      title = '👑 Maktab VIP (30 kun)';
    } else if (itemKey === 'PACK_500') {
      keyPrefix = 'PACK500';
      creditsBonus = 500;
      durationDays = 365;
      title = '⚡ AI Pack 500 (+500 AI tekshirish)';
    } else if (itemKey === 'PACK_1000') {
      keyPrefix = 'PACK1000';
      creditsBonus = 1000;
      durationDays = 365;
      title = '⚡ AI Pack 1000 (+1 000 AI tekshirish)';
    }

    const key = generateKey(keyPrefix);

    await db.licenseKey.create({
      data: {
        key: key,
        plan: itemKey,
        durationDays: durationDays,
        creditsBonus: creditsBonus,
        isUsed: false
      }
    });

    const customerText = `
🎉 <b>TO'LOVINGIZ TASDIQLANDI!</b>

Sizning <b>${title}</b> litsenziya kalitingiz muvaffaqiyatli tayyorlandi:

🔑 <b>Sizning kalitingiz:</b>
<code>${key}</code>
<i>(Nusxalash uchun kod ustiga bosing)</i>

⏳ <b>Muddati:</b> ${durationDays} kun

📲 <b>Faollashtirish bo'yicha yo'riqnoma:</b>
1. Saytga kiring: <b>${APP_URL}/pricing</b>
2. <b>"Telegram Bot orqali olingan kalit bormi?"</b> maydoniga ushbu kalitni kiriting.
3. <b>"Faollashtirish"</b> tugmasini bosing! 🚀
    `;

    await sendMessage(customerChatId, customerText.trim());

    const adminCaption = `✅ <b>TO'LOV TASDIQLANDI VA KALIT YUBORILDI!</b>\n\n👤 <b>Foydalanuvchi:</b> <code>${customerChatId}</code>\n📦 <b>Tarif / Paket:</b> ${itemKey}\n🔑 <b>Berilgan kalit:</b> <code>${key}</code>`;
    await editMessageCaption(adminChatId, messageId, adminCaption);
  } catch (err: any) {
    console.error("Error approving payment:", err);
    await sendMessage(adminChatId, `❌ Xatolik yuz berdi: ${err.message}`);
  }
}

async function sendTariffs(chatId: string | number) {
  const text = `
📊 <b>NOVDA AI (MAKTABAI) RASMIY TARIFLAR TIZIMI</b>

🥉 <b>1. START — 39 000 so'm / 30 kun:</b>
• 1 ta o'qituvchi, 2 ta sinf
• 40 ta dars, 30 ta test
• <b>300 ta AI tekshirish</b>
• Oddiy hisobotlar va natijalar

🥈 <b>2. USTOZ PRO — 69 000 so'm / 30 kun (⭐ Eng ommabop):</b>
• 1 ta o'qituvchi, 6 ta sinf
• 100 ta dars, 100 ta test
• <b>1 000 ta AI tekshirish</b>
• Kengaytirilgan hisobotlar, PDF/Excel eksport
• Ustuvor qo'llab-quvvatlash

💎 <b>3. USTOZ MAX — 119 000 so'm / 30 kun:</b>
• 2 ta o'qituvchi, 15 ta sinf
• 300 ta dars, 300 ta test
• <b>2 000 ta AI tekshirish</b>
• To'liq analitika va sinflarni solishtirish

🏫 <b>4. MAKTAB PRO — 229 000 so'm / 30 kun (🏫 Maktablar uchun):</b>
• 5 ta o'qituvchi, 50 ta sinf
• 1 000 ta dars, 1 000 ta test
• <b>4 000 ta AI tekshirish</b>
• Maktab dashboardi, sinflar tahlili, to'liq hisobot

👑 <b>5. MAKTAB VIP — 399 000 so'm / 30 kun:</b>
• 15 ta o'qituvchi, <b>Cheksiz sinf va darslar</b>
• <b>6 500 ta AI tekshirish</b>
• Maktab boshqaruv paneli, 24/7 menejer

⚡ <b>QO'SHIMCHA AI PAKETLAR:</b>
• AI Pack 500: <b>+500 ta AI tekshirish</b> — 29 000 so'm
• AI Pack 1000: <b>+1 000 ta AI tekshirish</b> — 49 000 so'm
  `;

  await sendMessage(chatId, text.trim(), getInlineMenu());
}

async function sendHelp(chatId: string | number) {
  const text = `
ℹ️ <b>QO'LLANMA: Kalitni sotib olish va faollashtirish</b>

1️⃣ Botdan kerakli <b>Tarif</b> yoki <b>AI Paket</b>ni tanlang.
2️⃣ Ko'rsatilgan karta raqamiga to'lov qilib, chek rasmini botga yuboring.
3️⃣ Admin to'lovni tasdiqlagach, bot sizga maxsus litsenziya kalitini yuboradi.
4️⃣ Saytga kiring: <b>${APP_URL}/pricing</b>
5️⃣ Kalitni kiritib, <b>"Faollashtirish"</b> tugmasini bosing — balansingiz bir zumda yangilanadi! 🎉

🌐 Sayt: <b>${APP_URL}</b>
  `;

  await sendMessage(chatId, text.trim(), getInlineMenu());
}

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  const rawText = msg.text || '';
  const text = rawText.trim();
  const firstName = escapeHtml(msg.from?.first_name || 'Ustoz');
  const username = msg.from?.username ? `@${msg.from.username}` : 'mavjud emas';

  // Admin generator commands
  if (String(chatId) === String(ADMIN_ID)) {
    if (text === '/admin') {
      try {
        const totalKeys = await db.licenseKey.count();
        const usedKeys = await db.licenseKey.count({ where: { isUsed: true } });
        const totalUsers = await db.user.count();

        const adminStats = `
👑 <b>ADMIN BOSHQARUV PANELI (24/7 Webhook)</b>

👥 <b>Jami foydalanuvchilar:</b> ${totalUsers} ta
🔑 <b>Jami yaratilgan kalitlar:</b> ${totalKeys} ta
✅ <b>Ishlatilgan kalitlar:</b> ${usedKeys} ta

💳 <b>Joriy to'lov kartasi:</b> 
<code>${PAYMENT_CARD}</code> (${PAYMENT_CARD_HOLDER})

📌 <b>Tezkor Generator buyruqlari:</b>
• <code>/gen start</code> — START kalit (39 000)
• <code>/gen pro</code> — PRO kalit (69 000)
• <code>/gen max</code> — MAX kalit (119 000)
• <code>/gen maktab_pro</code> — Maktab PRO kalit (229 000)
• <code>/gen maktab_vip</code> — Maktab VIP kalit (399 000)
• <code>/gen pack500</code> — AI Pack 500 (+500 AI)
• <code>/gen pack1000</code> — AI Pack 1000 (+1000 AI)
        `;
        await sendMessage(chatId, adminStats.trim());
      } catch (err) {
        console.error("Admin stats error:", err);
      }
      return;
    }

    if (text.startsWith('/gen ')) {
      const sub = text.replace('/gen ', '').trim().toLowerCase();
      let plan = 'PRO';
      let prefix = 'PRO';
      let bonus = 0;
      let days = 30;

      if (sub === 'start') { plan = 'START'; prefix = 'START'; }
      else if (sub === 'pro') { plan = 'PRO'; prefix = 'PRO'; }
      else if (sub === 'max') { plan = 'MAX'; prefix = 'MAX'; }
      else if (sub === 'maktab_pro') { plan = 'MAKTAB_PRO'; prefix = 'MKPRO'; }
      else if (sub === 'maktab_vip') { plan = 'MAKTAB_VIP'; prefix = 'MKVIP'; }
      else if (sub === 'pack500') { plan = 'PACK_500'; prefix = 'PACK500'; bonus = 500; days = 365; }
      else if (sub === 'pack1000') { plan = 'PACK_1000'; prefix = 'PACK1000'; bonus = 1000; days = 365; }

      const key = generateKey(prefix);
      await db.licenseKey.create({
        data: { key, plan, durationDays: days, creditsBonus: bonus, isUsed: false }
      });
      await sendMessage(chatId, `✅ <b>Yangi kalit yaratildi (${plan}):</b>\n<code>${key}</code>`);
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

👇 <i>To'lov hisobingizga tushganini tekshirib, tegishli tarif yoki paketni tasdiqlang:</i>
    `;

    const adminKeyboard = {
      inline_keyboard: [
        [
          { text: "🥉 START (39k)", callback_data: `approve_${chatId}_START` },
          { text: "🥈 PRO (69k) ⭐", callback_data: `approve_${chatId}_PRO` },
          { text: "💎 MAX (119k)", callback_data: `approve_${chatId}_MAX` }
        ],
        [
          { text: "🏫 MAKTAB PRO (229k)", callback_data: `approve_${chatId}_MAKTAB_PRO` },
          { text: "👑 VIP (399k)", callback_data: `approve_${chatId}_MAKTAB_VIP` }
        ],
        [
          { text: "⚡ AI Pack 500 (29k)", callback_data: `approve_${chatId}_PACK_500` },
          { text: "⚡ AI Pack 1000 (49k)", callback_data: `approve_${chatId}_PACK_1000` }
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
🔑 <b>Ustoz PRO, MAX, Maktab</b> litsenziya kalitlarini sotib olishingiz
⚡ <b>Qo'shimcha AI paketlar</b> xarid qilishingiz
🎁 <b>7 kunlik bepul sinov kalitini</b> olishingiz mumkin.

👇 <i>Quyidagi menyudan kerakli bo'limni tanlang:</i>
    `;
    await sendMessage(chatId, welcome.trim(), getInlineMenu());
    return;
  }

  if (text.includes('START') || text === '/start_plan') {
    await sendInvoice(chatId, 'START');
    return;
  }

  if (text.includes('PRO') || text === '/pro') {
    await sendInvoice(chatId, 'PRO');
    return;
  }

  if (text.includes('MAX') || text === '/max') {
    await sendInvoice(chatId, 'MAX');
    return;
  }

  if (text.includes('MAKTAB PRO') || text === '/maktab_pro') {
    await sendInvoice(chatId, 'MAKTAB_PRO');
    return;
  }

  if (text.includes('MAKTAB VIP') || text === '/maktab_vip') {
    await sendInvoice(chatId, 'MAKTAB_VIP');
    return;
  }

  if (text.includes('AI Paket') || text.includes('AI Pack')) {
    await sendMessage(chatId, `⚡ <b>Qo'shimcha AI Paketlar:</b>\n\n1. <b>AI Pack 500</b> — 29 000 so'm (+500 AI tekshirish)\n2. <b>AI Pack 1000</b> — 49 000 so'm (+1 000 AI tekshirish)\n\nKerakli paketni tanlang:`, {
      inline_keyboard: [
        [
          { text: "⚡ AI Pack 500 (29 000 so'm)", callback_data: 'buy_PACK_500' },
          { text: "⚡ AI Pack 1000 (49 000 so'm)", callback_data: 'buy_PACK_1000' }
        ],
        [
          { text: "⬅️ Asosiy menyu", callback_data: 'main_menu' }
        ]
      ]
    });
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

  if (text.includes('Qo\'llanma') || text.includes('Yordam') || text === '/help') {
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

  if (data.startsWith('buy_')) {
    const itemKey = data.replace('buy_', '');
    await sendInvoice(chatId, itemKey);
    return;
  }

  if (data === 'free_trial') {
    await grantTrialKey(chatId);
    return;
  }

  if (data.startsWith('confirm_paid_')) {
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
    // Format: approve_<chatId>_<itemKey> (e.g. approve_12345_PRO or approve_12345_MAKTAB_PRO)
    const targetChatId = parts[1];
    const itemKey = parts.slice(2).join('_');
    await approvePayment(chatId, messageId, targetChatId, itemKey);
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
    return NextResponse.json({ ok: true, error: err.message }, { status: 200 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: 'active',
    service: 'Novda AI SaaS Telegram Webhook',
    timestamp: new Date().toISOString()
  });
}

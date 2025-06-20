require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// استخدام التوكن من المتغيرات البيئية أو مباشرة
const token = process.env.TELEGRAM_BOT_TOKEN || '7808906118:AAGw3YsXONFdYk8t1hlvCgnCm-8alIGpFtk';

// إنشاء كائن البوت
const bot = new TelegramBot(token, { polling: true });

// رسالة الترحيب
const welcomeMessage = `
🎉 *مرحباً بك في بوت Smart Coin!* 🪙

يسعدنا انضمامك إلى *مجتمع التعدين الذكي*.

✨ *ماذا يمكنك أن تفعل هنا؟*
• 💰 احصل على *15 عملة يومياً* مجاناً بالتعدين.
• 🚀 اشترِ *حزم تعدين* لزيادة الأرباح.
• 👥 *ادعُ أصدقاءك* واربح مكافآت.
• 📝 *أكمل المهام* للحصول على عملات إضافية.

اضغط على الزر أدناه لبدء رحلتك معنا! 👇
`;

// الاستماع لأمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // إرسال رسالة الترحيب مع زر يحتوي على الرابط
  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🌐 زيارة موقع Smart Coin',
            url: 'https://smaer-project.onrender.com'
          }
        ]
      ]
    }
  });

  console.log(`🟢 مستخدم جديد بدأ المحادثة: ${msg.from.username || msg.from.first_name} (${chatId})`);
});

// الاستماع لأي رسالة أخرى
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // تجاهل الأوامر
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  // الرد على أي رسالة أخرى برسالة مختصرة وزر للموقع
  bot.sendMessage(chatId, '👋 مرحباً! اضغط الزر أدناه للوصول إلى كل ميزات Smart Coin 👇', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔗 زيارة الموقع',
            url: 'https://smaer-project.onrender.com'
          }
        ]
      ]
    }
  });
});

console.log('🚀 بوت Smart Coin قيد التشغيل...');

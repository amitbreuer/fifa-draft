import { Router, Request, Response } from 'express';
import { Bot, webhookCallback } from 'grammy';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBAPP_URL = process.env.WEBAPP_URL || '';

// Only initialize bot if token is provided
export const bot: Bot | null = BOT_TOKEN ? new Bot(BOT_TOKEN) : null;

if (bot) {
  // /start command (with optional deep link for joining a draft)
  bot.command('start', async (ctx) => {
    const deepLinkParam = ctx.match; // e.g. /start ABC123

    if (deepLinkParam) {
      await ctx.reply(`Join draft **${deepLinkParam}**?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Open Draft', web_app: { url: `${WEBAPP_URL}/lobby?mode=join&code=${deepLinkParam}` } },
          ]],
        },
      });
    } else {
      await ctx.reply('Welcome to Galactico! ⚽\n\nCreate a new draft or join one with friends.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🆕 Create Draft', web_app: { url: `${WEBAPP_URL}/lobby?mode=create` } }],
            [{ text: '🎮 Join Draft', web_app: { url: `${WEBAPP_URL}/lobby?mode=join` } }],
          ],
        },
      });
    }

    // Store chat_id for notifications
    if (ctx.from) {
      const { storeChatId } = await import('../services/notifications.js');
      storeChatId(ctx.from.id, ctx.chat.id);
    }
  });

  bot.command('newdraft', async (ctx) => {
    await ctx.reply('Create a new draft:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🆕 Create Draft', web_app: { url: `${WEBAPP_URL}/lobby?mode=create` } },
        ]],
      },
    });
  });
} else {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot features disabled');
}

export const botRouter = Router();

// Webhook handler (only if bot is initialized)
if (bot) {
  botRouter.post('/', webhookCallback(bot, 'express'));
}

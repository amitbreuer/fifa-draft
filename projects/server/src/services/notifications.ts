import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, draftManagers } from '../db/schema.js';
import { bot } from '../routes/bot.js';

const WEBAPP_URL = process.env.WEBAPP_URL || '';
const PRESENCE_THRESHOLD_MS = 10_000; // 10 seconds

/** Store a user's chat_id for sending notifications */
export async function storeChatId(telegramId: number, chatId: number): Promise<void> {
  try {
    await db.update(users)
      .set({ telegramChatId: chatId })
      .where(eq(users.telegramId, telegramId));
  } catch (err) {
    console.error('Failed to store chatId:', err);
  }
}

/** Notify the next manager it's their turn (only if they're offline) */
export async function notifyNextManager(
  draft: { id: string; name: string; shortCode: string },
  manager: { userId: number; lastSeenAt: Date | null },
  round: number
): Promise<void> {
  try {
    // Check presence: skip if manager is online
    if (manager.lastSeenAt) {
      const msSinceLastSeen = Date.now() - new Date(manager.lastSeenAt).getTime();
      if (msSinceLastSeen < PRESENCE_THRESHOLD_MS) {
        return; // Manager is online, they'll see via polling
      }
    }

    if (!bot) return; // Bot not configured

    // Get user's chat_id. For Telegram private chats the chat_id equals the
    // user's telegramId, so fall back to that when we haven't captured a chat_id
    // via /start (users who launch the app straight from the menu button never
    // trigger the /start handler that stores telegramChatId).
    const [user] = await db.select().from(users).where(eq(users.id, manager.userId));
    if (!user) return;
    const chatId = user.telegramChatId ?? user.telegramId;
    if (!chatId) return;

    await bot.api.sendMessage(
      chatId,
      `🎮 It's your turn in **${draft.name}**! Round ${round}.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '⚽ Open Draft', web_app: { url: `${WEBAPP_URL}/draft?code=${draft.shortCode}` } },
          ]],
        },
      }
    );
  } catch (err) {
    console.error('Notification error:', err);
  }
}

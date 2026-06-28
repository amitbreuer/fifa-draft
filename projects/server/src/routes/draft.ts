import { Router, Response } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { drafts, draftManagers, picks, users } from '../db/schema.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { notifyNextManager } from '../services/notifications.js';

export const draftRouter = Router();

draftRouter.use(authMiddleware);

function getCode(req: AuthenticatedRequest): string {
  const code = req.params.code;
  return Array.isArray(code) ? code[0] : code;
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get user's drafts
draftRouter.get('/mine', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) { res.json([]); return; }

    // Find all drafts where this user is a manager
    const myDraftManagers = await db.select({
      draftId: draftManagers.draftId,
      slotIndex: draftManagers.slotIndex,
    }).from(draftManagers).where(eq(draftManagers.userId, user.id));

    if (myDraftManagers.length === 0) { res.json([]); return; }

    const draftIds = myDraftManagers.map(dm => dm.draftId);

    // Get all those drafts with their managers
    const myDrafts = await db.select({
      id: drafts.id,
      shortCode: drafts.shortCode,
      name: drafts.name,
      status: drafts.status,
      maxRounds: drafts.maxRounds,
      currentManagerIndex: drafts.currentManagerIndex,
      currentRound: drafts.currentRound,
      createdAt: drafts.createdAt,
      updatedAt: drafts.updatedAt,
    }).from(drafts).where(sql`${drafts.id} IN (${sql.join(draftIds.map(id => sql`${id}`), sql`, `)})`);

    // Get manager count + current turn manager for each draft
    const result = await Promise.all(myDrafts.map(async (draft) => {
      const managers = await db.select({
        id: draftManagers.id,
        slotIndex: draftManagers.slotIndex,
        userId: draftManagers.userId,
        firstName: users.firstName,
        username: users.username,
      }).from(draftManagers)
        .innerJoin(users, eq(draftManagers.userId, users.id))
        .where(eq(draftManagers.draftId, draft.id));

      const currentManager = managers.find(m => m.slotIndex === draft.currentManagerIndex);
      const mySlot = myDraftManagers.find(dm => dm.draftId === draft.id);
      const isMyTurn = draft.status === 'active' && mySlot?.slotIndex === draft.currentManagerIndex;

      return {
        ...draft,
        managerCount: managers.length,
        currentTurnName: currentManager?.username ? `@${currentManager.username}` : currentManager?.firstName || null,
        isMyTurn,
      };
    }));

    // Sort: my turn first, then active, then waiting, then complete
    result.sort((a, b) => {
      if (a.isMyTurn && !b.isMyTurn) return -1;
      if (!a.isMyTurn && b.isMyTurn) return 1;
      const statusOrder = { active: 0, waiting: 1, complete: 2 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
      return aOrder - bOrder;
    });

    res.json(result);
  } catch (err) {
    console.error('Get my drafts error:', err);
    res.status(500).json({ error: 'Failed to get drafts' });
  }
});

// Delete a draft
draftRouter.delete('/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    // Only creator can delete
    if (draft.creatorId !== user.id) { res.status(403).json({ error: 'Only creator can delete' }); return; }

    // Delete in order: picks → managers → draft
    await db.delete(picks).where(eq(picks.draftId, draft.id));
    await db.delete(draftManagers).where(eq(draftManagers.draftId, draft.id));
    await db.delete(drafts).where(eq(drafts.id, draft.id));

    res.json({ message: 'Draft deleted' });
  } catch (err) {
    console.error('Delete draft error:', err);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Create a new draft
draftRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, maxRounds = 18, datasetId = 'fc-2026' } = req.body;
    const telegramId = req.user!.telegramId;

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) {
      [user] = await db.insert(users).values({
        telegramId,
        username: req.user!.username,
        firstName: req.user!.firstName,
      }).returning();
    }

    const shortCode = generateShortCode();
    const [draft] = await db.insert(drafts).values({
      shortCode,
      name: name || 'FIFA Draft',
      creatorId: user.id,
      maxManagers: 10,
      maxRounds,
      datasetId,
    }).returning();

    // Creator auto-joins as first manager
    await db.insert(draftManagers).values({
      draftId: draft.id,
      userId: user.id,
      slotIndex: 0,
    });

    res.status(201).json({ id: draft.id, shortCode: draft.shortCode, name: draft.name });
  } catch (err) {
    console.error('Create draft error:', err);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Get draft info
draftRouter.get('/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    const managers = await db.select({
      id: draftManagers.id,
      slotIndex: draftManagers.slotIndex,
      formation: draftManagers.formation,
      userId: draftManagers.userId,
      username: users.username,
      firstName: users.firstName,
    })
      .from(draftManagers)
      .innerJoin(users, eq(draftManagers.userId, users.id))
      .where(eq(draftManagers.draftId, draft.id))
      .orderBy(draftManagers.slotIndex);

    res.json({ ...draft, managers });
  } catch (err) {
    console.error('Get draft error:', err);
    res.status(500).json({ error: 'Failed to get draft' });
  }
});

// Join a draft
draftRouter.post('/:code/join', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }
    if (draft.status !== 'waiting') { res.status(400).json({ error: 'Draft already started' }); return; }

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) {
      [user] = await db.insert(users).values({
        telegramId,
        username: req.user!.username,
        firstName: req.user!.firstName,
      }).returning();
    }

    // Check if already joined
    const [existing] = await db.select().from(draftManagers)
      .where(and(eq(draftManagers.draftId, draft.id), eq(draftManagers.userId, user.id)));
    if (existing) { res.json({ message: 'Already joined', slotIndex: existing.slotIndex }); return; }

    // Check capacity (max 10 participants)
    const currentManagers = await db.select().from(draftManagers).where(eq(draftManagers.draftId, draft.id));
    if (currentManagers.length >= 10) { res.status(400).json({ error: 'Draft is full (max 10)' }); return; }

    const [manager] = await db.insert(draftManagers).values({
      draftId: draft.id,
      userId: user.id,
      slotIndex: currentManagers.length,
    }).returning();

    res.status(201).json({ message: 'Joined', slotIndex: manager.slotIndex });
  } catch (err) {
    console.error('Join draft error:', err);
    res.status(500).json({ error: 'Failed to join draft' });
  }
});

// Start the draft (creator only)
draftRouter.post('/:code/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    // Verify creator
    const [creator] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!creator || draft.creatorId !== creator.id) {
      res.status(403).json({ error: 'Only the creator can start the draft' }); return;
    }
    if (draft.status !== 'waiting') { res.status(400).json({ error: 'Draft already started' }); return; }

    const managers = await db.select().from(draftManagers).where(eq(draftManagers.draftId, draft.id));
    if (managers.length < 1) { res.status(400).json({ error: 'Need at least 1 manager' }); return; }

    await db.update(drafts).set({ status: 'active', updatedAt: new Date() }).where(eq(drafts.id, draft.id));

    res.json({ message: 'Draft started' });
  } catch (err) {
    console.error('Start draft error:', err);
    res.status(500).json({ error: 'Failed to start draft' });
  }
});

// Poll draft state (called every 3s by all clients)
draftRouter.get('/:code/state', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    // Update presence (last_seen_at) for the requesting manager
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (user) {
      await db.update(draftManagers)
        .set({ lastSeenAt: new Date() })
        .where(and(eq(draftManagers.draftId, draft.id), eq(draftManagers.userId, user.id)));
    }

    // Get managers with user info
    const managers = await db.select({
      id: draftManagers.id,
      slotIndex: draftManagers.slotIndex,
      formation: draftManagers.formation,
      fieldPositions: draftManagers.fieldPositions,
      benchPlayerIds: draftManagers.benchPlayerIds,
      userId: draftManagers.userId,
      username: users.username,
      firstName: users.firstName,
      lastSeenAt: draftManagers.lastSeenAt,
    })
      .from(draftManagers)
      .innerJoin(users, eq(draftManagers.userId, users.id))
      .where(eq(draftManagers.draftId, draft.id))
      .orderBy(draftManagers.slotIndex);

    // Get all picks
    const allPicks = await db.select().from(picks)
      .where(eq(picks.draftId, draft.id))
      .orderBy(picks.pickOrder);

    res.json({
      id: draft.id,
      shortCode: draft.shortCode,
      name: draft.name,
      status: draft.status,
      maxRounds: draft.maxRounds,
      currentManagerIndex: draft.currentManagerIndex,
      currentRound: draft.currentRound,
      isSnakeDirection: draft.isSnakeDirection,
      managers,
      picks: allPicks,
    });
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

// Submit a pick
draftRouter.post('/:code/pick', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const { playerId } = req.body;
    if (!playerId) { res.status(400).json({ error: 'playerId required' }); return; }

    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }
    if (draft.status !== 'active') { res.status(400).json({ error: 'Draft not active' }); return; }

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const [manager] = await db.select().from(draftManagers)
      .where(and(eq(draftManagers.draftId, draft.id), eq(draftManagers.userId, user.id)));
    if (!manager) { res.status(403).json({ error: 'Not in this draft' }); return; }

    // Verify it's this manager's turn
    if (manager.slotIndex !== draft.currentManagerIndex) {
      res.status(403).json({ error: 'Not your turn' }); return;
    }

    // Verify player not already picked
    const [existingPick] = await db.select().from(picks)
      .where(and(eq(picks.draftId, draft.id), eq(picks.playerId, playerId)));
    if (existingPick) { res.status(400).json({ error: 'Player already drafted' }); return; }

    // Calculate pick order
    const allPicks = await db.select().from(picks).where(eq(picks.draftId, draft.id));
    const pickOrder = allPicks.length;

    // Insert pick
    await db.insert(picks).values({
      draftId: draft.id,
      managerId: manager.id,
      playerId,
      round: draft.currentRound,
      pickOrder,
    });

    // Advance turn (snake draft logic)
    const managersCount = await db.select().from(draftManagers).where(eq(draftManagers.draftId, draft.id));
    const totalManagers = managersCount.length;

    let nextIndex = draft.currentManagerIndex;
    let nextRound = draft.currentRound;
    let nextSnake = draft.isSnakeDirection;

    if (!nextSnake) {
      nextIndex++;
      if (nextIndex >= totalManagers) {
        nextIndex = totalManagers - 1;
        nextSnake = true;
        nextRound++;
      }
    } else {
      nextIndex--;
      if (nextIndex < 0) {
        nextIndex = 0;
        nextSnake = false;
        nextRound++;
      }
    }

    // Check if draft is complete
    const newStatus = nextRound > draft.maxRounds ? 'complete' : 'active';

    await db.update(drafts).set({
      currentManagerIndex: nextIndex,
      currentRound: Math.min(nextRound, draft.maxRounds),
      isSnakeDirection: nextSnake,
      status: newStatus,
      lastPickAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(drafts.id, draft.id));

    // Notify next manager if they're offline
    if (newStatus === 'active') {
      const nextManager = managersCount.find(m => m.slotIndex === nextIndex);
      if (nextManager) {
        notifyNextManager(draft, nextManager, nextRound);
      }
    }

    res.json({ message: 'Pick submitted', nextManagerIndex: nextIndex, round: nextRound, status: newStatus });
  } catch (err) {
    console.error('Pick error:', err);
    res.status(500).json({ error: 'Failed to submit pick' });
  }
});

// Update squad (formation/field/bench)
draftRouter.put('/:code/squad', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const telegramId = req.user!.telegramId;
    const { formation, fieldPositions, benchPlayerIds } = req.body;

    const [draft] = await db.select().from(drafts).where(eq(drafts.shortCode, getCode(req)));
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const updateData: any = {};
    if (formation !== undefined) updateData.formation = formation;
    if (fieldPositions !== undefined) updateData.fieldPositions = fieldPositions;
    if (benchPlayerIds !== undefined) updateData.benchPlayerIds = benchPlayerIds;

    await db.update(draftManagers)
      .set(updateData)
      .where(and(eq(draftManagers.draftId, draft.id), eq(draftManagers.userId, user.id)));

    res.json({ message: 'Squad updated' });
  } catch (err) {
    console.error('Update squad error:', err);
    res.status(500).json({ error: 'Failed to update squad' });
  }
});

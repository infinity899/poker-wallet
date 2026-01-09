import type { CashSession, DbSession, DbTournament, Tournament } from '~/types';
import { useTypedSupabaseClient } from '~/composables/useTypedSupabase';

// Convert database session to frontend session
export function dbSessionToSession(dbSession: DbSession): CashSession {
  return {
    id: dbSession.id,
    date: dbSession.date,
    startTime: dbSession.start_time ?? undefined,
    endTime: dbSession.end_time ?? undefined,
    type: dbSession.type,
    currency: dbSession.currency,
    stake: dbSession.stake,
    smallBlind: dbSession.small_blind,
    bigBlind: dbSession.big_blind,
    game: dbSession.game,
    result: dbSession.result,
    duration: dbSession.duration,
    location: dbSession.location ?? undefined,
    site: dbSession.site ?? undefined,
    tableCount: dbSession.table_count ?? undefined,
    buyInTotal: dbSession.buy_in_total ?? undefined,
    cashOutTotal: dbSession.cash_out_total ?? undefined,
    rakeFees: dbSession.rake_fees ?? undefined,
    notes: dbSession.notes ?? undefined,
    tags: dbSession.tags || [],
    status: dbSession.status || 'completed',
    createdAt: dbSession.created_at,
    updatedAt: dbSession.updated_at,
  };
}

// Convert frontend session to database session
export function sessionToDbSession(session: Omit<CashSession, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DbSession, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    date: session.date,
    start_time: session.startTime ?? null,
    end_time: session.endTime ?? null,
    type: session.type,
    currency: session.currency,
    stake: session.stake,
    small_blind: session.smallBlind,
    big_blind: session.bigBlind,
    game: session.game,
    result: session.result,
    duration: session.duration,
    location: session.location ?? null,
    site: session.site ?? null,
    table_count: session.tableCount ?? null,
    buy_in_total: session.buyInTotal ?? null,
    cash_out_total: session.cashOutTotal ?? null,
    bankroll_initial: null,
    bankroll_final: null,
    rake_fees: session.rakeFees ?? null,
    notes: session.notes ?? null,
    tags: session.tags || [],
    status: session.status || 'completed',
  };
}

// Convert database tournament to frontend tournament
export function dbTournamentToTournament(dbTournament: DbTournament): Tournament {
  return {
    id: dbTournament.id,
    date: dbTournament.date,
    type: dbTournament.type,
    currency: dbTournament.currency,
    name: dbTournament.name,
    buyIn: dbTournament.buy_in,
    fee: dbTournament.fee,
    entries: dbTournament.entries,
    winnings: dbTournament.winnings,
    venue: dbTournament.venue ?? undefined,
    site: dbTournament.site ?? undefined,
    fieldSize: dbTournament.field_size ?? undefined,
    finishPosition: dbTournament.finish_position ?? undefined,
    cashed: dbTournament.cashed ?? undefined,
    notes: dbTournament.notes ?? undefined,
    tags: dbTournament.tags || [],
    status: dbTournament.status || 'completed',
    createdAt: dbTournament.created_at,
    updatedAt: dbTournament.updated_at,
  };
}

// Convert frontend tournament to database tournament
export function tournamentToDbTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DbTournament, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    date: tournament.date,
    type: tournament.type,
    currency: tournament.currency,
    name: tournament.name,
    buy_in: tournament.buyIn,
    fee: tournament.fee,
    entries: tournament.entries,
    winnings: tournament.winnings,
    venue: tournament.venue ?? null,
    site: tournament.site ?? null,
    field_size: tournament.fieldSize ?? null,
    finish_position: tournament.finishPosition ?? null,
    cashed: tournament.cashed ?? null,
    notes: tournament.notes ?? null,
    tags: tournament.tags || [],
    status: tournament.status || 'completed',
  };
}

// Database operations composable
export function useDatabase() {
  const supabase = useTypedSupabaseClient();
  const user = useSupabaseUser();
  const authStore = useAuthStore();

  // useSupabaseUser returns JWT payload where user ID is in 'sub' field
  const userId = computed(() => user.value?.sub);

  // Sessions
  async function fetchSessions(): Promise<CashSession[]> {
    if (!userId.value || authStore.isDemoMode) {
      return [];
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId.value)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(dbSessionToSession);
  }

  async function createSession(session: Omit<CashSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashSession> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const dbSession = sessionToDbSession(session, userId.value);

    const { data, error } = await supabase
      .from('sessions')
      .insert(dbSession as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return dbSessionToSession(data as DbSession);
  }

  async function updateSession(id: string, updates: Partial<CashSession>): Promise<CashSession> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const dbUpdates: Record<string, any> = {};

    if (updates.date !== undefined) {
      dbUpdates.date = updates.date;
    }
    if (updates.startTime !== undefined) {
      dbUpdates.start_time = updates.startTime;
    }
    if (updates.endTime !== undefined) {
      dbUpdates.end_time = updates.endTime;
    }
    if (updates.type !== undefined) {
      dbUpdates.type = updates.type;
    }
    if (updates.currency !== undefined) {
      dbUpdates.currency = updates.currency;
    }
    if (updates.stake !== undefined) {
      dbUpdates.stake = updates.stake;
    }
    if (updates.smallBlind !== undefined) {
      dbUpdates.small_blind = updates.smallBlind;
    }
    if (updates.bigBlind !== undefined) {
      dbUpdates.big_blind = updates.bigBlind;
    }
    if (updates.game !== undefined) {
      dbUpdates.game = updates.game;
    }
    if (updates.result !== undefined) {
      dbUpdates.result = updates.result;
    }
    if (updates.duration !== undefined) {
      dbUpdates.duration = updates.duration;
    }
    if (updates.location !== undefined) {
      dbUpdates.location = updates.location;
    }
    if (updates.site !== undefined) {
      dbUpdates.site = updates.site;
    }
    if (updates.tableCount !== undefined) {
      dbUpdates.table_count = updates.tableCount;
    }
    if (updates.buyInTotal !== undefined) {
      dbUpdates.buy_in_total = updates.buyInTotal;
    }
    if (updates.cashOutTotal !== undefined) {
      dbUpdates.cash_out_total = updates.cashOutTotal;
    }
    if (updates.rakeFees !== undefined) {
      dbUpdates.rake_fees = updates.rakeFees;
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes;
    }
    if (updates.tags !== undefined) {
      dbUpdates.tags = updates.tags;
    }
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(dbUpdates as any)
      .eq('id', id)
      .eq('user_id', userId.value)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return dbSessionToSession(data as DbSession);
  }

  async function deleteSession(id: string): Promise<void> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId.value);

    if (error) {
      throw error;
    }
  }

  // Tournaments
  async function fetchTournaments(): Promise<Tournament[]> {
    if (!userId.value || authStore.isDemoMode) {
      return [];
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('user_id', userId.value)
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(dbTournamentToTournament);
  }

  async function createTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tournament> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const dbTournament = tournamentToDbTournament(tournament, userId.value);

    const { data, error } = await supabase
      .from('tournaments')
      .insert(dbTournament as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return dbTournamentToTournament(data as DbTournament);
  }

  async function updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const dbUpdates: Record<string, any> = {};

    if (updates.date !== undefined) {
      dbUpdates.date = updates.date;
    }
    if (updates.type !== undefined) {
      dbUpdates.type = updates.type;
    }
    if (updates.currency !== undefined) {
      dbUpdates.currency = updates.currency;
    }
    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }
    if (updates.buyIn !== undefined) {
      dbUpdates.buy_in = updates.buyIn;
    }
    if (updates.fee !== undefined) {
      dbUpdates.fee = updates.fee;
    }
    if (updates.entries !== undefined) {
      dbUpdates.entries = updates.entries;
    }
    if (updates.winnings !== undefined) {
      dbUpdates.winnings = updates.winnings;
    }
    if (updates.venue !== undefined) {
      dbUpdates.venue = updates.venue;
    }
    if (updates.site !== undefined) {
      dbUpdates.site = updates.site;
    }
    if (updates.fieldSize !== undefined) {
      dbUpdates.field_size = updates.fieldSize;
    }
    if (updates.finishPosition !== undefined) {
      dbUpdates.finish_position = updates.finishPosition;
    }
    if (updates.cashed !== undefined) {
      dbUpdates.cashed = updates.cashed;
    }
    if (updates.notes !== undefined) {
      dbUpdates.notes = updates.notes;
    }
    if (updates.tags !== undefined) {
      dbUpdates.tags = updates.tags;
    }
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status;
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update(dbUpdates as any)
      .eq('id', id)
      .eq('user_id', userId.value)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return dbTournamentToTournament(data as DbTournament);
  }

  async function deleteTournament(id: string): Promise<void> {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId.value);

    if (error) {
      throw error;
    }
  }

  return {
    userId,

    // Sessions
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,

    // Tournaments
    fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
  };
}

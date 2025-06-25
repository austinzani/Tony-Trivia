import { supabase } from '../lib/supabase';
import type { 
  Tournament, 
  TournamentParticipant, 
  TournamentMatch, 
  TournamentStanding,
  TournamentRound,
  TournamentSettings 
} from '../types/database';

export class TournamentService {
  // Create a new tournament
  static async createTournament(data: {
    name: string;
    description?: string;
    format: Tournament['format'];
    maxTeams: number;
    minTeams?: number;
    settings?: TournamentSettings;
    startDate?: string;
  }): Promise<Tournament | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        host_id: user.id,
        name: data.name,
        description: data.description,
        format: data.format,
        max_teams: data.maxTeams,
        min_teams: data.minTeams || 2,
        settings: data.settings || {},
        start_date: data.startDate,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament:', error);
      return null;
    }

    return tournament;
  }

  // Get tournament by ID
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }

    return data;
  }

  // List tournaments with filters
  static async listTournaments(filters?: {
    status?: Tournament['status'];
    hostId?: string;
    format?: Tournament['format'];
  }): Promise<Tournament[]> {
    let query = supabase.from('tournaments').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.hostId) {
      query = query.eq('host_id', filters.hostId);
    }
    if (filters?.format) {
      query = query.eq('format', filters.format);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing tournaments:', error);
      return [];
    }

    return data || [];
  }

  // Update tournament status
  static async updateTournamentStatus(
    tournamentId: string, 
    status: Tournament['status']
  ): Promise<boolean> {
    const { error } = await supabase
      .from('tournaments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', tournamentId);

    if (error) {
      console.error('Error updating tournament status:', error);
      return false;
    }

    return true;
  }

  // Register a team for tournament
  static async registerTeam(
    tournamentId: string, 
    teamId: string,
    seed?: number
  ): Promise<TournamentParticipant | null> {
    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        seed,
        status: 'registered',
        stats: {
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          points_scored: 0,
          points_conceded: 0
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering team:', error);
      return null;
    }

    return data;
  }

  // Get tournament participants
  static async getParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }

    return data || [];
  }

  // Generate tournament brackets (single elimination)
  static async generateSingleEliminationBracket(tournamentId: string): Promise<boolean> {
    try {
      // Get all participants
      const participants = await this.getParticipants(tournamentId);
      if (participants.length < 2) {
        throw new Error('Not enough participants');
      }

      // Calculate number of rounds
      const totalRounds = Math.ceil(Math.log2(participants.length));
      const totalMatches = Math.pow(2, totalRounds) - 1;

      // Update tournament with total rounds
      await supabase
        .from('tournaments')
        .update({ 
          total_rounds: totalRounds,
          current_round: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      // Generate first round matches
      const firstRoundMatches = this.generateFirstRoundMatches(participants);
      
      // Insert all matches
      const matches = [];
      let matchNumber = 1;

      // First round matches
      for (const match of firstRoundMatches) {
        matches.push({
          tournament_id: tournamentId,
          round: 1,
          match_number: matchNumber++,
          bracket_position: `R1M${matchNumber - 1}`,
          team1_id: match.team1?.id || null,
          team2_id: match.team2?.id || null,
          status: match.team2 ? 'scheduled' : 'bye',
          match_data: {}
        });
      }

      // Generate placeholder matches for subsequent rounds
      for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = Math.pow(2, totalRounds - round);
        for (let i = 0; i < matchesInRound; i++) {
          const position = round === totalRounds ? 'F' : 
                          round === totalRounds - 1 ? `SF${i + 1}` : 
                          `R${round}M${i + 1}`;
          
          matches.push({
            tournament_id: tournamentId,
            round,
            match_number: matchNumber++,
            bracket_position: position,
            status: 'scheduled',
            match_data: {}
          });
        }
      }

      const { error } = await supabase
        .from('tournament_matches')
        .insert(matches);

      if (error) {
        console.error('Error creating matches:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error generating bracket:', error);
      return false;
    }
  }

  // Generate first round matches with proper seeding
  private static generateFirstRoundMatches(
    participants: TournamentParticipant[]
  ): Array<{ team1?: TournamentParticipant; team2?: TournamentParticipant }> {
    const matches = [];
    const numParticipants = participants.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numParticipants)));
    const numByes = nextPowerOfTwo - numParticipants;

    // Sort by seed
    const seededParticipants = [...participants].sort((a, b) => 
      (a.seed || 999) - (b.seed || 999)
    );

    // Standard bracket seeding (1v16, 8v9, 4v13, etc.)
    const bracketSize = nextPowerOfTwo;
    for (let i = 0; i < bracketSize / 2; i++) {
      const highSeed = i;
      const lowSeed = bracketSize - 1 - i;

      const team1 = seededParticipants[highSeed];
      const team2 = lowSeed < numParticipants ? seededParticipants[lowSeed] : undefined;

      matches.push({ team1, team2 });
    }

    return matches;
  }

  // Generate round-robin schedule
  static async generateRoundRobinSchedule(tournamentId: string): Promise<boolean> {
    try {
      const participants = await this.getParticipants(tournamentId);
      if (participants.length < 2) {
        throw new Error('Not enough participants');
      }

      const rounds = this.generateRoundRobinRounds(participants);
      const totalRounds = rounds.length;

      // Update tournament
      await supabase
        .from('tournaments')
        .update({ 
          total_rounds: totalRounds,
          current_round: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      // Create rounds
      const roundRecords = rounds.map((_, index) => ({
        tournament_id: tournamentId,
        round_number: index + 1,
        name: `Round ${index + 1}`,
        status: index === 0 ? 'upcoming' : 'upcoming'
      }));

      await supabase.from('tournament_rounds').insert(roundRecords);

      // Create matches
      const matches = [];
      let matchNumber = 1;

      rounds.forEach((round, roundIndex) => {
        round.forEach((match) => {
          matches.push({
            tournament_id: tournamentId,
            round: roundIndex + 1,
            match_number: matchNumber++,
            team1_id: match.team1.id,
            team2_id: match.team2 ? match.team2.id : null,
            status: match.team2 ? 'scheduled' : 'bye',
            match_data: {}
          });
        });
      });

      const { error: matchError } = await supabase
        .from('tournament_matches')
        .insert(matches);

      if (matchError) {
        console.error('Error creating matches:', matchError);
        return false;
      }

      // Initialize standings
      const standings = participants.map((p) => ({
        tournament_id: tournamentId,
        participant_id: p.id,
        position: 0,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        matches_drawn: 0,
        points_for: 0,
        points_against: 0,
        tournament_points: 0,
        tiebreaker_score: 0
      }));

      await supabase.from('tournament_standings').insert(standings);

      return true;
    } catch (error) {
      console.error('Error generating round-robin schedule:', error);
      return false;
    }
  }

  // Generate round-robin rounds using circle method
  private static generateRoundRobinRounds(
    participants: TournamentParticipant[]
  ): Array<Array<{ team1: TournamentParticipant; team2?: TournamentParticipant }>> {
    const teams = [...participants];
    const rounds = [];
    
    // Add dummy team for odd number of participants
    if (teams.length % 2 === 1) {
      teams.push(null as any); // Bye
    }

    const numTeams = teams.length;
    const numRounds = numTeams - 1;

    for (let round = 0; round < numRounds; round++) {
      const matches = [];
      
      for (let i = 0; i < numTeams / 2; i++) {
        const team1 = teams[i];
        const team2 = teams[numTeams - 1 - i];
        
        if (team1 && team2) {
          matches.push({ team1, team2 });
        } else if (team1) {
          matches.push({ team1, team2: undefined }); // Bye
        }
      }
      
      rounds.push(matches);
      
      // Rotate teams (keep first team fixed)
      teams.splice(1, 0, teams.pop()!);
    }

    return rounds;
  }

  // Get tournament matches
  static async getMatches(
    tournamentId: string, 
    round?: number
  ): Promise<TournamentMatch[]> {
    let query = supabase
      .from('tournament_matches')
      .select(`
        *,
        team1:tournament_participants!tournament_matches_team1_id_fkey(
          *,
          team:teams(*)
        ),
        team2:tournament_participants!tournament_matches_team2_id_fkey(
          *,
          team:teams(*)
        )
      `)
      .eq('tournament_id', tournamentId);

    if (round) {
      query = query.eq('round', round);
    }

    const { data, error } = await query.order('round').order('match_number');

    if (error) {
      console.error('Error fetching matches:', error);
      return [];
    }

    return data || [];
  }

  // Update match result
  static async updateMatchResult(
    matchId: string,
    result: {
      team1Score: number;
      team2Score: number;
      winnerId?: string;
      loserId?: string;
    }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('tournament_matches')
      .update({
        team1_score: result.team1Score,
        team2_score: result.team2Score,
        winner_id: result.winnerId,
        loser_id: result.loserId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId);

    if (error) {
      console.error('Error updating match result:', error);
      return false;
    }

    // For single elimination, advance winner to next round
    const { data: match } = await supabase
      .from('tournament_matches')
      .select('*, tournament:tournaments(*)')
      .eq('id', matchId)
      .single();

    if (match && match.tournament.format === 'single_elimination') {
      await this.advanceWinner(match);
    }

    return true;
  }

  // Advance winner to next round (single elimination)
  private static async advanceWinner(completedMatch: TournamentMatch): Promise<void> {
    if (!completedMatch.winner_id) return;

    const nextRound = completedMatch.round + 1;
    const matchesInCurrentRound = Math.pow(2, 
      Math.ceil(Math.log2(completedMatch.match_number)) - completedMatch.round + 1
    );
    const positionInRound = ((completedMatch.match_number - 1) % matchesInCurrentRound) + 1;
    const nextMatchPosition = Math.ceil(positionInRound / 2);

    // Find next match
    const { data: nextMatch } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', completedMatch.tournament_id)
      .eq('round', nextRound)
      .eq('match_number', nextMatchPosition)
      .single();

    if (nextMatch) {
      const isUpperBracket = positionInRound % 2 === 1;
      const update = isUpperBracket 
        ? { team1_id: completedMatch.winner_id }
        : { team2_id: completedMatch.winner_id };

      await supabase
        .from('tournament_matches')
        .update(update)
        .eq('id', nextMatch.id);
    }

    // Update participant status if eliminated
    if (completedMatch.loser_id) {
      await supabase
        .from('tournament_participants')
        .update({ 
          status: 'eliminated',
          eliminated_at: new Date().toISOString()
        })
        .eq('id', completedMatch.loser_id);
    }
  }

  // Get tournament standings (for round-robin)
  static async getStandings(tournamentId: string): Promise<TournamentStanding[]> {
    const { data, error } = await supabase
      .from('tournament_standings')
      .select(`
        *,
        participant:tournament_participants(
          *,
          team:teams(*)
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('position');

    if (error) {
      console.error('Error fetching standings:', error);
      return [];
    }

    return data || [];
  }

  // Subscribe to tournament updates
  static subscribeTournamentUpdates(
    tournamentId: string,
    onUpdate: (payload: any) => void
  ) {
    return supabase
      .channel(`tournament:${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        onUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_standings',
          filter: `tournament_id=eq.${tournamentId}`
        },
        onUpdate
      )
      .subscribe();
  }
}
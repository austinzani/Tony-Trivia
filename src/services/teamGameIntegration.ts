import { supabase } from './supabase';
import type { TeamMemberStatus, TeamActivity } from '../hooks/useTeamPresence';

export interface GameTeamState {
  teamId: string;
  gameRoomId: string;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  readyMembers: string[];
  totalMembers: number;
  currentQuestion?: {
    id: string;
    text: string;
    timeLimit: number;
    startedAt: string;
  };
  teamAnswer?: {
    answer: string;
    pointValue: number;
    submittedAt: string;
    submittedBy: string;
  };
  score: number;
  rank: number;
}

export interface TeamGameEvent {
  id: string;
  type: 'member_ready' | 'member_unready' | 'answer_submitted' | 'score_updated' | 'question_started' | 'question_ended';
  teamId: string;
  gameRoomId: string;
  userId?: string;
  payload: any;
  timestamp: string;
}

export interface GameReadinessCheck {
  teamId: string;
  teamName: string;
  totalMembers: number;
  readyMembers: number;
  onlineMembers: number;
  isReady: boolean;
  memberStatuses: {
    userId: string;
    username: string;
    status: 'online' | 'away' | 'offline' | 'ready' | 'in_game';
    isReady: boolean;
  }[];
}

class TeamGameIntegrationService {
  private eventListeners: Map<string, Function[]> = new Map();

  /**
   * Subscribe to team-game integration events
   */
  subscribeToTeamGameEvents(
    gameRoomId: string,
    teamId: string,
    callback: (event: TeamGameEvent) => void
  ) {
    const channelName = `team-game:${gameRoomId}:${teamId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'team_game_event' }, ({ payload }) => {
        callback(payload as TeamGameEvent);
      })
      .subscribe();

    // Store listener for cleanup
    const listeners = this.eventListeners.get(channelName) || [];
    listeners.push(() => channel.unsubscribe());
    this.eventListeners.set(channelName, listeners);

    return () => {
      channel.unsubscribe();
      const currentListeners = this.eventListeners.get(channelName) || [];
      const index = currentListeners.indexOf(() => channel.unsubscribe());
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  /**
   * Broadcast team-game event
   */
  async broadcastTeamGameEvent(event: Omit<TeamGameEvent, 'id' | 'timestamp'>) {
    const fullEvent: TeamGameEvent = {
      ...event,
      id: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const channelName = `team-game:${event.gameRoomId}:${event.teamId}`;
    
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'team_game_event',
      payload: fullEvent,
    });

    return fullEvent;
  }

  /**
   * Get current team game state
   */
  async getTeamGameState(teamId: string, gameRoomId: string): Promise<GameTeamState | null> {
    try {
      // Get team data
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            user_id,
            username,
            role,
            status
          )
        `)
        .eq('id', teamId)
        .eq('room_id', gameRoomId)
        .single();

      if (teamError || !teamData) {
        console.error('Error fetching team data:', teamError);
        return null;
      }

      // Get game room state
      const { data: gameRoom, error: gameError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', gameRoomId)
        .single();

      if (gameError || !gameRoom) {
        console.error('Error fetching game room:', gameError);
        return null;
      }

      // Get current question if game is active
      let currentQuestion;
      if (gameRoom.status === 'active') {
        const { data: questionData } = await supabase
          .from('game_questions')
          .select('*')
          .eq('game_room_id', gameRoomId)
          .eq('is_current', true)
          .single();
        
        if (questionData) {
          currentQuestion = {
            id: questionData.id,
            text: questionData.question_text,
            timeLimit: questionData.time_limit,
            startedAt: questionData.started_at,
          };
        }
      }

      // Get team's current answer
      let teamAnswer;
      if (currentQuestion) {
        const { data: answerData } = await supabase
          .from('team_answers')
          .select(`
            *,
            submitted_by_user:users(username)
          `)
          .eq('team_id', teamId)
          .eq('question_id', currentQuestion.id)
          .single();

        if (answerData) {
          teamAnswer = {
            answer: answerData.answer_text,
            pointValue: answerData.point_value,
            submittedAt: answerData.submitted_at,
            submittedBy: answerData.submitted_by_user?.username || 'Unknown',
          };
        }
      }

      // Get team score and rank
      const { data: scoreData } = await supabase
        .from('team_scores')
        .select('total_score, current_rank')
        .eq('team_id', teamId)
        .eq('game_room_id', gameRoomId)
        .single();

      // Count ready members (online or ready status)
      const readyMembers = teamData.team_members
        .filter((member: any) => ['online', 'ready'].includes(member.status))
        .map((member: any) => member.user_id);

      return {
        teamId,
        gameRoomId,
        status: gameRoom.status,
        readyMembers,
        totalMembers: teamData.team_members.length,
        currentQuestion,
        teamAnswer,
        score: scoreData?.total_score || 0,
        rank: scoreData?.current_rank || 0,
      };
    } catch (error) {
      console.error('Error getting team game state:', error);
      return null;
    }
  }

  /**
   * Update member readiness status
   */
  async updateMemberReadiness(
    teamId: string,
    gameRoomId: string,
    userId: string,
    isReady: boolean
  ): Promise<boolean> {
    try {
      // Update member status in team_members table
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ 
          status: isReady ? 'ready' : 'online',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating member readiness:', updateError);
        return false;
      }

      // Broadcast readiness change event
      await this.broadcastTeamGameEvent({
        type: isReady ? 'member_ready' : 'member_unready',
        teamId,
        gameRoomId,
        userId,
        payload: { isReady, userId },
      });

      return true;
    } catch (error) {
      console.error('Error updating member readiness:', error);
      return false;
    }
  }

  /**
   * Submit team answer with integration
   */
  async submitTeamAnswer(
    teamId: string,
    gameRoomId: string,
    questionId: string,
    answer: string,
    pointValue: number,
    submittedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if team has already submitted an answer
      const { data: existingAnswer } = await supabase
        .from('team_answers')
        .select('id')
        .eq('team_id', teamId)
        .eq('question_id', questionId)
        .single();

      if (existingAnswer) {
        return { success: false, error: 'Team has already submitted an answer for this question' };
      }

      // Submit the answer
      const { data: answerData, error: submitError } = await supabase
        .from('team_answers')
        .insert({
          team_id: teamId,
          question_id: questionId,
          answer_text: answer,
          point_value: pointValue,
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (submitError) {
        console.error('Error submitting answer:', submitError);
        return { success: false, error: submitError.message };
      }

      // Broadcast answer submission event
      await this.broadcastTeamGameEvent({
        type: 'answer_submitted',
        teamId,
        gameRoomId,
        userId: submittedBy,
        payload: {
          questionId,
          answer,
          pointValue,
          submittedBy,
          answerId: answerData.id,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting team answer:', error);
      return { success: false, error: 'Failed to submit answer' };
    }
  }

  /**
   * Check readiness of all teams in a game room
   */
  async checkGameReadiness(gameRoomId: string): Promise<GameReadinessCheck[]> {
    try {
      // Get all teams with their members
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_members (
            user_id,
            username,
            role,
            status
          )
        `)
        .eq('room_id', gameRoomId);

      if (teamsError || !teamsData) {
        console.error('Error fetching teams:', teamsError);
        return [];
      }

      return teamsData.map(team => {
        const members = team.team_members || [];
        const onlineMembers = members.filter((m: any) => 
          ['online', 'ready', 'in_game'].includes(m.status)
        );
        const readyMembers = members.filter((m: any) => 
          ['ready', 'in_game'].includes(m.status)
        );

        return {
          teamId: team.id,
          teamName: team.name,
          totalMembers: members.length,
          readyMembers: readyMembers.length,
          onlineMembers: onlineMembers.length,
          isReady: members.length > 0 && readyMembers.length === members.length,
          memberStatuses: members.map((member: any) => ({
            userId: member.user_id,
            username: member.username,
            status: member.status,
            isReady: ['ready', 'in_game'].includes(member.status),
          })),
        };
      });
    } catch (error) {
      console.error('Error checking game readiness:', error);
      return [];
    }
  }

  /**
   * Start game with team integration
   */
  async startGameWithTeamIntegration(
    gameRoomId: string,
    hostId: string
  ): Promise<{ success: boolean; error?: string; unreadyTeams?: string[] }> {
    try {
      // Check team readiness
      const readinessCheck = await this.checkGameReadiness(gameRoomId);
      const unreadyTeams = readinessCheck
        .filter(team => !team.isReady && team.totalMembers > 0)
        .map(team => team.teamName);

      // Update game room status
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          started_by: hostId,
        })
        .eq('id', gameRoomId);

      if (updateError) {
        console.error('Error starting game:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update all team members status to in_game
      const { error: memberUpdateError } = await supabase
        .from('team_members')
        .update({ status: 'in_game' })
        .in('team_id', readinessCheck.map(team => team.teamId));

      if (memberUpdateError) {
        console.warn('Error updating member statuses:', memberUpdateError);
      }

      // Broadcast game start events for each team
      for (const team of readinessCheck) {
        await this.broadcastTeamGameEvent({
          type: 'question_started',
          teamId: team.teamId,
          gameRoomId,
          userId: hostId,
          payload: {
            gameStarted: true,
            startedBy: hostId,
            teamReadiness: team,
          },
        });
      }

      return {
        success: true,
        unreadyTeams: unreadyTeams.length > 0 ? unreadyTeams : undefined,
      };
    } catch (error) {
      console.error('Error starting game with team integration:', error);
      return { success: false, error: 'Failed to start game' };
    }
  }

  /**
   * Update team scores and broadcast events
   */
  async updateTeamScores(gameRoomId: string, scoreUpdates: Array<{
    teamId: string;
    points: number;
    questionId: string;
    isCorrect: boolean;
  }>): Promise<boolean> {
    try {
      for (const update of scoreUpdates) {
        // Update team score
        const { error: scoreError } = await supabase
          .rpc('update_team_score', {
            p_team_id: update.teamId,
            p_game_room_id: gameRoomId,
            p_points: update.points,
            p_question_id: update.questionId,
          });

        if (scoreError) {
          console.error('Error updating team score:', scoreError);
          continue;
        }

        // Broadcast score update event
        await this.broadcastTeamGameEvent({
          type: 'score_updated',
          teamId: update.teamId,
          gameRoomId,
          payload: {
            points: update.points,
            questionId: update.questionId,
            isCorrect: update.isCorrect,
            totalScore: 0, // Will be calculated by the database function
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating team scores:', error);
      return false;
    }
  }

  /**
   * Get team leaderboard with member information
   */
  async getTeamLeaderboard(gameRoomId: string): Promise<Array<{
    teamId: string;
    teamName: string;
    score: number;
    rank: number;
    memberCount: number;
    onlineMembers: number;
    lastActivity: string;
  }>> {
    try {
      const { data: leaderboardData, error } = await supabase
        .from('team_scores')
        .select(`
          team_id,
          total_score,
          current_rank,
          updated_at,
          team:teams (
            name,
            team_members (
              user_id,
              status,
              last_seen
            )
          )
        `)
        .eq('game_room_id', gameRoomId)
        .order('current_rank', { ascending: true });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return (leaderboardData || []).map(entry => {
        const members = entry.team?.team_members || [];
        const onlineMembers = members.filter((m: any) => 
          ['online', 'ready', 'in_game'].includes(m.status)
        );

        return {
          teamId: entry.team_id,
          teamName: entry.team?.name || 'Unknown Team',
          score: entry.total_score,
          rank: entry.current_rank,
          memberCount: members.length,
          onlineMembers: onlineMembers.length,
          lastActivity: entry.updated_at,
        };
      });
    } catch (error) {
      console.error('Error getting team leaderboard:', error);
      return [];
    }
  }

  /**
   * Clean up all event listeners
   */
  cleanup() {
    for (const [channelName, listeners] of this.eventListeners.entries()) {
      listeners.forEach(cleanup => cleanup());
    }
    this.eventListeners.clear();
  }
}

export const teamGameIntegration = new TeamGameIntegrationService(); 
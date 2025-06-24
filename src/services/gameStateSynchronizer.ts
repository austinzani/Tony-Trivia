import { supabase } from './supabase';
import type { GameState, GameEvent } from '../types/game';
import { withRetry } from '../utils/networkAwareApi';

export interface GameStateVersion {
  version: number;
  state: GameState;
  timestamp: string;
  clientId: string;
  hash: string;
}

export interface StateConflict {
  localVersion: GameStateVersion;
  remoteVersion: GameStateVersion;
  conflictType: 'version' | 'timestamp' | 'concurrent';
  conflictingFields: string[];
}

export interface SyncResult {
  success: boolean;
  finalState: GameState;
  conflicts?: StateConflict[];
  resolved: boolean;
  version: number;
}

export interface SyncOptions {
  forceLocal?: boolean;
  forceRemote?: boolean;
  retryOnConflict?: boolean;
  maxRetries?: number;
}

export class GameStateSynchronizer {
  private gameId: string;
  private clientId: string;
  private currentVersion: number = 0;
  private stateHistory: GameStateVersion[] = [];
  private maxHistorySize: number = 50;
  private syncInProgress: boolean = false;
  private pendingSync: boolean = false;
  private lastSyncTime: Date | null = null;

  // Event listeners
  private onSyncSuccess?: (result: SyncResult) => void;
  private onSyncConflict?: (conflict: StateConflict) => void;
  private onSyncError?: (error: Error) => void;

  constructor(
    gameId: string,
    clientId: string = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ) {
    this.gameId = gameId;
    this.clientId = clientId;
  }

  // Event listener setups
  setOnSyncSuccess(callback: (result: SyncResult) => void): void {
    this.onSyncSuccess = callback;
  }

  setOnSyncConflict(callback: (conflict: StateConflict) => void): void {
    this.onSyncConflict = callback;
  }

  setOnSyncError(callback: (error: Error) => void): void {
    this.onSyncError = callback;
  }

  // Generate hash for state comparison
  private generateStateHash(state: GameState): string {
    // Create a simplified hash based on critical state properties
    const critical = {
      phase: state.phase,
      currentRound: state.currentRound,
      currentQuestion: state.currentQuestion?.id,
      isActive: state.isActive,
      isPaused: state.isPaused,
      lastUpdated: state.lastUpdated,
      playerCount: Object.keys(state.players).length,
      teamCount: Object.keys(state.teams).length,
    };

    return btoa(JSON.stringify(critical));
  }

  // Create version from current state
  private createVersion(state: GameState): GameStateVersion {
    return {
      version: this.currentVersion + 1,
      state: { ...state },
      timestamp: new Date().toISOString(),
      clientId: this.clientId,
      hash: this.generateStateHash(state),
    };
  }

  // Store version in history
  private addToHistory(version: GameStateVersion): void {
    this.stateHistory.push(version);
    
    // Maintain history size limit
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistorySize);
    }
    
    this.currentVersion = version.version;
  }

  // Detect conflicts between local and remote states
  private detectConflicts(
    localVersion: GameStateVersion,
    remoteVersion: GameStateVersion
  ): StateConflict | null {
    // No conflict if hashes match
    if (localVersion.hash === remoteVersion.hash) {
      return null;
    }

    // Version conflict
    if (localVersion.version !== remoteVersion.version) {
      return {
        localVersion,
        remoteVersion,
        conflictType: 'version',
        conflictingFields: this.findConflictingFields(localVersion.state, remoteVersion.state),
      };
    }

    // Timestamp conflict (concurrent updates)
    const localTime = new Date(localVersion.timestamp).getTime();
    const remoteTime = new Date(remoteVersion.timestamp).getTime();
    const timeDiff = Math.abs(localTime - remoteTime);

    if (timeDiff < 1000) { // Less than 1 second apart
      return {
        localVersion,
        remoteVersion,
        conflictType: 'concurrent',
        conflictingFields: this.findConflictingFields(localVersion.state, remoteVersion.state),
      };
    }

    return {
      localVersion,
      remoteVersion,
      conflictType: 'timestamp',
      conflictingFields: this.findConflictingFields(localVersion.state, remoteVersion.state),
    };
  }

  // Find specific fields that differ between states
  private findConflictingFields(local: GameState, remote: GameState): string[] {
    const conflicts: string[] = [];

    // Compare critical fields
    const fieldsToCheck = [
      'phase',
      'currentRound',
      'currentQuestion',
      'isActive',
      'isPaused',
      'completedRounds',
      'answeredQuestions',
    ];

    fieldsToCheck.forEach(field => {
      if (JSON.stringify(local[field as keyof GameState]) !== 
          JSON.stringify(remote[field as keyof GameState])) {
        conflicts.push(field);
      }
    });

    // Compare players and teams
    if (JSON.stringify(local.players) !== JSON.stringify(remote.players)) {
      conflicts.push('players');
    }

    if (JSON.stringify(local.teams) !== JSON.stringify(remote.teams)) {
      conflicts.push('teams');
    }

    return conflicts;
  }

  // Resolve conflicts using various strategies
  private resolveConflicts(
    conflict: StateConflict,
    strategy: 'local-wins' | 'remote-wins' | 'merge' | 'latest-timestamp' = 'latest-timestamp'
  ): GameState {
    const { localVersion, remoteVersion } = conflict;

    switch (strategy) {
      case 'local-wins':
        return localVersion.state;

      case 'remote-wins':
        return remoteVersion.state;

      case 'latest-timestamp':
        const localTime = new Date(localVersion.timestamp).getTime();
        const remoteTime = new Date(remoteVersion.timestamp).getTime();
        return remoteTime > localTime ? remoteVersion.state : localVersion.state;

      case 'merge':
        return this.mergeStates(localVersion.state, remoteVersion.state, conflict.conflictingFields);

      default:
        return remoteVersion.state; // Default to remote
    }
  }

  // Intelligent state merging
  private mergeStates(
    local: GameState,
    remote: GameState,
    conflictingFields: string[]
  ): GameState {
    const merged = { ...local };

    // Game flow fields: prefer the more advanced state
    if (conflictingFields.includes('phase')) {
      // Use phase progression priority
      const phaseOrder = ['pre-game', 'lobby', 'active', 'reviewing', 'between-rounds', 'finished'];
      const localIndex = phaseOrder.indexOf(local.phase);
      const remoteIndex = phaseOrder.indexOf(remote.phase);
      
      if (remoteIndex > localIndex) {
        merged.phase = remote.phase;
      }
    }

    // Round/question progression: prefer higher values
    if (conflictingFields.includes('currentRound')) {
      merged.currentRound = Math.max(local.currentRound, remote.currentRound);
    }

    if (conflictingFields.includes('completedRounds')) {
      merged.completedRounds = Math.max(local.completedRounds, remote.completedRounds);
    }

    if (conflictingFields.includes('answeredQuestions')) {
      merged.answeredQuestions = Math.max(local.answeredQuestions, remote.answeredQuestions);
    }

    // Game state flags: prefer active states
    if (conflictingFields.includes('isActive')) {
      merged.isActive = local.isActive || remote.isActive;
    }

    if (conflictingFields.includes('isPaused')) {
      merged.isPaused = local.isPaused && remote.isPaused; // Only paused if both say so
    }

    // Players and teams: merge carefully
    if (conflictingFields.includes('players')) {
      merged.players = this.mergePlayers(local.players, remote.players);
    }

    if (conflictingFields.includes('teams')) {
      merged.teams = this.mergeTeams(local.teams, remote.teams);
    }

    // Update timestamp
    merged.lastUpdated = new Date().toISOString();

    return merged;
  }

  // Merge player states
  private mergePlayers(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
    const merged = { ...local };

    Object.keys(remote).forEach(playerId => {
      if (!merged[playerId]) {
        // New player from remote
        merged[playerId] = remote[playerId];
      } else {
        // Merge existing player - prefer higher scores and more recent activity
        const localPlayer = merged[playerId];
        const remotePlayer = remote[playerId];

        merged[playerId] = {
          ...localPlayer,
          totalPoints: Math.max(localPlayer.totalPoints || 0, remotePlayer.totalPoints || 0),
          roundPoints: { ...localPlayer.roundPoints, ...remotePlayer.roundPoints },
          lastActive: remotePlayer.lastActive > localPlayer.lastActive 
            ? remotePlayer.lastActive 
            : localPlayer.lastActive,
        };
      }
    });

    return merged;
  }

  // Merge team states
  private mergeTeams(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
    const merged = { ...local };

    Object.keys(remote).forEach(teamId => {
      if (!merged[teamId]) {
        // New team from remote
        merged[teamId] = remote[teamId];
      } else {
        // Merge existing team
        const localTeam = merged[teamId];
        const remoteTeam = remote[teamId];

        merged[teamId] = {
          ...localTeam,
          totalPoints: Math.max(localTeam.totalPoints || 0, remoteTeam.totalPoints || 0),
          roundPoints: { ...localTeam.roundPoints, ...remoteTeam.roundPoints },
          members: Array.from(new Set([...localTeam.members, ...remoteTeam.members])),
        };
      }
    });

    return merged;
  }

  // Sync state with server
  async syncState(localState: GameState, options: SyncOptions = {}): Promise<SyncResult> {
    if (this.syncInProgress) {
      this.pendingSync = true;
      return { success: false, finalState: localState, resolved: false, version: this.currentVersion };
    }

    this.syncInProgress = true;

    try {
      return await withRetry(async () => {
        // Get current remote state
        const { data: remoteStateData, error } = await supabase
          .from('game_state')
          .select('*')
          .eq('id', this.gameId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch remote state: ${error.message}`);
        }

        // Create versions for comparison
        const localVersion = this.createVersion(localState);
        const remoteVersion: GameStateVersion = {
          version: remoteStateData.version || 0,
          state: remoteStateData,
          timestamp: remoteStateData.last_updated || new Date().toISOString(),
          clientId: remoteStateData.client_id || 'unknown',
          hash: this.generateStateHash(remoteStateData),
        };

        // Detect conflicts
        const conflict = this.detectConflicts(localVersion, remoteVersion);

        if (!conflict) {
          // No conflict, just update version
          this.addToHistory(localVersion);
          this.lastSyncTime = new Date();
          
          const result: SyncResult = {
            success: true,
            finalState: localState,
            resolved: true,
            version: localVersion.version,
          };

          this.onSyncSuccess?.(result);
          return result;
        }

        // Handle conflict
        this.onSyncConflict?.(conflict);

        // Apply resolution strategy
        let resolvedState: GameState;
        
        if (options.forceLocal) {
          resolvedState = localVersion.state;
        } else if (options.forceRemote) {
          resolvedState = remoteVersion.state;
        } else {
          resolvedState = this.resolveConflicts(conflict);
        }

        // Update remote state with resolved version
        const resolvedVersion = this.createVersion(resolvedState);
        
        const { error: updateError } = await supabase
          .from('game_state')
          .update({
            ...resolvedState,
            version: resolvedVersion.version,
            last_updated: resolvedVersion.timestamp,
            client_id: this.clientId,
          })
          .eq('id', this.gameId);

        if (updateError) {
          throw new Error(`Failed to update state: ${updateError.message}`);
        }

        this.addToHistory(resolvedVersion);
        this.lastSyncTime = new Date();

        const result: SyncResult = {
          success: true,
          finalState: resolvedState,
          conflicts: [conflict],
          resolved: true,
          version: resolvedVersion.version,
        };

        this.onSyncSuccess?.(result);
        return result;

      }, {
        maxRetries: options.maxRetries || 3,
        retryDelay: 1000,
        exponentialBackoff: true,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sync failed');
      this.onSyncError?.(err);
      
      return {
        success: false,
        finalState: localState,
        resolved: false,
        version: this.currentVersion,
      };
    } finally {
      this.syncInProgress = false;
      
      // Process pending sync if needed
      if (this.pendingSync) {
        this.pendingSync = false;
        // Could trigger another sync here if needed
      }
    }
  }

  // Get sync status
  getSyncStatus(): {
    version: number;
    lastSync: Date | null;
    syncInProgress: boolean;
    pendingSync: boolean;
    historySize: number;
  } {
    return {
      version: this.currentVersion,
      lastSync: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      pendingSync: this.pendingSync,
      historySize: this.stateHistory.length,
    };
  }

  // Get state history
  getHistory(limit?: number): GameStateVersion[] {
    if (limit) {
      return this.stateHistory.slice(-limit);
    }
    return [...this.stateHistory];
  }

  // Rollback to a previous version
  rollbackToVersion(version: number): GameState | null {
    const targetVersion = this.stateHistory.find(v => v.version === version);
    
    if (targetVersion) {
      this.currentVersion = version;
      return { ...targetVersion.state };
    }
    
    return null;
  }

  // Clear history
  clearHistory(): void {
    this.stateHistory = [];
    this.currentVersion = 0;
  }
}

export default GameStateSynchronizer; 
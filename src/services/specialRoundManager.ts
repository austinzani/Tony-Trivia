import { RoundManager } from './roundManager';
import { ScoreManager } from './scoreManager';
import type {
  SpecialRound,
  SpecialRoundEvent,
  WagerRound,
  WagerSubmission,
  WagerPhase,
  PictureRound,
  ImageLoadStatus,
  BonusRound,
  BonusParticipantStatus,
  BonusScore,
  LightningRound,
  LightningProgress,
  SpecialRoundConfig,
  SpecialRoundValidationResult,
  SpecialRoundMetrics
} from '../types/specialRounds';
import {
  SpecialRoundType,
  SpecialRoundEventType
} from '../types/specialRounds';

export type SpecialRoundEventListener = (event: SpecialRoundEvent) => void;

export interface SpecialRoundManagerOptions {
  enableWagerRounds?: boolean;
  enablePictureRounds?: boolean;
  enableBonusRounds?: boolean;
  enableLightningRounds?: boolean;
  enableAudioRounds?: boolean;
  enableVideoRounds?: boolean;
  enableTeamChallengeRounds?: boolean;
  autoPreloadMedia?: boolean;
  validateRoundTransitions?: boolean;
  persistRoundData?: boolean;
}

export class SpecialRoundManager {
  private roundManager: RoundManager;
  private scoreManager: ScoreManager;
  private currentSpecialRound: SpecialRound | null = null;
  private specialRoundConfigs: Map<SpecialRoundType, SpecialRoundConfig> = new Map();
  private listeners: Map<SpecialRoundEventType, Set<SpecialRoundEventListener>> = new Map();
  private options: Required<SpecialRoundManagerOptions>;
  private mediaCache: Map<string, any> = new Map(); // For caching loaded media
  private timers: Map<string, NodeJS.Timeout> = new Map(); // For managing timers

  constructor(
    roundManager: RoundManager,
    scoreManager: ScoreManager,
    options: SpecialRoundManagerOptions = {}
  ) {
    this.roundManager = roundManager;
    this.scoreManager = scoreManager;
    
    this.options = {
      enableWagerRounds: true,
      enablePictureRounds: true,
      enableBonusRounds: true,
      enableLightningRounds: true,
      enableAudioRounds: true,
      enableVideoRounds: true,
      enableTeamChallengeRounds: true,
      autoPreloadMedia: true,
      validateRoundTransitions: true,
      persistRoundData: true,
      ...options
    };

    this.setupDefaultConfigs();
    this.setupEventListeners();
  }

  private setupDefaultConfigs(): void {
    // Default Wager Round Config
    if (this.options.enableWagerRounds) {
      this.specialRoundConfigs.set(SpecialRoundType.WAGER, {
        specialType: SpecialRoundType.WAGER,
        enabled: true,
        settings: {
          minWager: 0,
          maxWager: 100,
          allowZeroWager: true,
          wagerTimeLimit: 60,
          questionTimeLimit: 30,
          defaultWager: 10,
          wagerMultiplier: 1.0
        }
      });
    }

    // Default Picture Round Config
    if (this.options.enablePictureRounds) {
      this.specialRoundConfigs.set(SpecialRoundType.PICTURE, {
        specialType: SpecialRoundType.PICTURE,
        enabled: true,
        settings: {
          imageQuality: 'high',
          allowZoom: true,
          showImagePreview: true,
          imageDisplayTime: 0,
          preloadImages: true,
          imageTransitions: true
        }
      });
    }

    // Default Bonus Round Config
    if (this.options.enableBonusRounds) {
      this.specialRoundConfigs.set(SpecialRoundType.BONUS, {
        specialType: SpecialRoundType.BONUS,
        enabled: true,
        settings: {
          bonusMultiplier: 2.0,
          streakBonus: true,
          streakBonusThreshold: 3,
          streakBonusPoints: 10,
          timeBonus: true,
          timeBonusThreshold: 10,
          timeBonusMultiplier: 1.5,
          perfectRoundBonus: 50,
          eliminationMode: false,
          eliminationThreshold: 3
        }
      });
    }

    // Default Lightning Round Config
    if (this.options.enableLightningRounds) {
      this.specialRoundConfigs.set(SpecialRoundType.LIGHTNING, {
        specialType: SpecialRoundType.LIGHTNING,
        enabled: true,
        settings: {
          questionTimeLimit: 5,
          totalTimeLimit: 60,
          autoAdvance: true,
          showRunningScore: true,
          pointsPerCorrect: 10,
          penaltyPerIncorrect: 0,
          questionCount: 20
        }
      });
    }

    // Additional configs for other round types...
  }

  private setupEventListeners(): void {
    // Listen to round manager events
    this.roundManager.addEventListener('round_started', (event) => {
      if (this.isSpecialRound(event.data?.round)) {
        this.handleSpecialRoundStart(event.data.round);
      }
    });

    this.roundManager.addEventListener('round_ended', (event) => {
      if (this.currentSpecialRound) {
        this.handleSpecialRoundEnd();
      }
    });
  }

  // Special Round Management
  public async startSpecialRound(specialRound: SpecialRound): Promise<void> {
    try {
      // Validate round
      const validation = this.validateSpecialRound(specialRound);
      if (!validation.isValid) {
        throw new Error(`Invalid special round: ${validation.errors.join(', ')}`);
      }

      this.currentSpecialRound = specialRound;

      // Initialize round-specific data
      await this.initializeSpecialRound(specialRound);

      // Start the round
      await this.roundManager.startRound(specialRound);

      this.emitEvent(SpecialRoundEventType.ROUND_STARTED, {
        roundId: specialRound.id,
        specialType: specialRound.specialType,
        data: { round: specialRound }
      });

    } catch (error) {
      console.error('Failed to start special round:', error);
      throw error;
    }
  }

  public async endSpecialRound(): Promise<void> {
    if (!this.currentSpecialRound) {
      throw new Error('No active special round to end');
    }

    try {
      // Handle round-specific cleanup
      await this.finalizeSpecialRound(this.currentSpecialRound);

      // End the round
      await this.roundManager.endRound();

      this.emitEvent(SpecialRoundEventType.ROUND_ENDED, {
        roundId: this.currentSpecialRound.id,
        specialType: this.currentSpecialRound.specialType,
        data: { round: this.currentSpecialRound }
      });

      this.currentSpecialRound = null;

    } catch (error) {
      console.error('Failed to end special round:', error);
      throw error;
    }
  }

  // Wager Round Management
  public async submitWager(participantId: string, wagerAmount: number): Promise<void> {
    const wagerRound = this.getCurrentWagerRound();
    if (!wagerRound) {
      throw new Error('No active wager round');
    }

    if (wagerRound.wagerPhase !== WagerPhase.WAGER_SUBMISSION) {
      throw new Error('Wager submission phase is not active');
    }

    // Validate wager amount
    const settings = wagerRound.settings;
    if (wagerAmount < settings.minWager || wagerAmount > settings.maxWager) {
      throw new Error(`Wager must be between ${settings.minWager} and ${settings.maxWager}`);
    }

    if (!settings.allowZeroWager && wagerAmount === 0) {
      throw new Error('Zero wagers are not allowed');
    }

    const wagerSubmission: WagerSubmission = {
      participantId,
      wagerAmount,
      submittedAt: new Date(),
      isLocked: false
    };

    wagerRound.wagerSubmissions.set(participantId, wagerSubmission);

    this.emitEvent(SpecialRoundEventType.WAGER_SUBMITTED, {
      roundId: wagerRound.id,
      specialType: SpecialRoundType.WAGER,
      participantId,
      data: { wagerSubmission }
    });
  }

  public async lockWager(participantId: string): Promise<void> {
    const wagerRound = this.getCurrentWagerRound();
    if (!wagerRound) {
      throw new Error('No active wager round');
    }

    const wagerSubmission = wagerRound.wagerSubmissions.get(participantId);
    if (!wagerSubmission) {
      throw new Error('No wager submission found for participant');
    }

    wagerSubmission.isLocked = true;

    this.emitEvent(SpecialRoundEventType.WAGER_LOCKED, {
      roundId: wagerRound.id,
      specialType: SpecialRoundType.WAGER,
      participantId,
      data: { wagerSubmission }
    });
  }

  public async lockAllWagers(): Promise<void> {
    const wagerRound = this.getCurrentWagerRound();
    if (!wagerRound) {
      throw new Error('No active wager round');
    }

    for (const [participantId, wagerSubmission] of wagerRound.wagerSubmissions) {
      if (!wagerSubmission.isLocked) {
        wagerSubmission.isLocked = true;
        this.emitEvent(SpecialRoundEventType.WAGER_LOCKED, {
          roundId: wagerRound.id,
          specialType: SpecialRoundType.WAGER,
          participantId,
          data: { wagerSubmission }
        });
      }
    }
  }

  public async advanceWagerPhase(): Promise<void> {
    const wagerRound = this.getCurrentWagerRound();
    if (!wagerRound) {
      throw new Error('No active wager round');
    }

    const phases = Object.values(WagerPhase);
    const currentIndex = phases.indexOf(wagerRound.wagerPhase);
    
    if (currentIndex < phases.length - 1) {
      wagerRound.wagerPhase = phases[currentIndex + 1];
      
      this.emitEvent(SpecialRoundEventType.PHASE_CHANGED, {
        roundId: wagerRound.id,
        specialType: SpecialRoundType.WAGER,
        data: { oldPhase: phases[currentIndex], newPhase: wagerRound.wagerPhase }
      });

      // Handle phase-specific logic
      await this.handleWagerPhaseChange(wagerRound);
    }
  }

  private async handleWagerPhaseChange(wagerRound: WagerRound): Promise<void> {
    switch (wagerRound.wagerPhase) {
      case WagerPhase.WAGER_SUBMISSION:
        // Start wager timer
        this.startWagerTimer(wagerRound);
        break;
      case WagerPhase.QUESTION_DISPLAY:
        // Lock all wagers and display question
        await this.lockAllWagers();
        break;
      case WagerPhase.ANSWER_SUBMISSION:
        // Start answer timer
        this.startAnswerTimer(wagerRound);
        break;
      case WagerPhase.RESULTS:
        // Calculate and display results
        await this.calculateWagerResults(wagerRound);
        break;
    }
  }

  private startWagerTimer(wagerRound: WagerRound): void {
    const timerId = `wager_${wagerRound.id}`;
    const timer = setTimeout(() => {
      this.lockAllWagers();
      this.advanceWagerPhase();
    }, wagerRound.settings.wagerTimeLimit * 1000);
    
    this.timers.set(timerId, timer);
    wagerRound.currentWagerDeadline = new Date(Date.now() + wagerRound.settings.wagerTimeLimit * 1000);
  }

  private startAnswerTimer(wagerRound: WagerRound): void {
    const timerId = `answer_${wagerRound.id}`;
    const timer = setTimeout(() => {
      this.advanceWagerPhase();
    }, wagerRound.settings.questionTimeLimit * 1000);
    
    this.timers.set(timerId, timer);
  }

  private async calculateWagerResults(wagerRound: WagerRound): Promise<void> {
    // This would integrate with the score manager to calculate results
    // based on wager amounts and answer correctness
    for (const [participantId, wagerSubmission] of wagerRound.wagerSubmissions) {
      // Get the participant's answer and calculate score
      // This is a simplified implementation
      const baseScore = 10; // This would come from answer correctness
      const wagerMultiplier = wagerSubmission.wagerAmount / 10;
      const finalScore = baseScore * wagerMultiplier;
      
      // Update score through score manager
      // await this.scoreManager.updatePlayerScore(participantId, finalScore);
    }
  }

  // Picture Round Management
  public async preloadImages(pictureRound: PictureRound): Promise<void> {
    if (!this.options.autoPreloadMedia) return;

    for (const question of pictureRound.questions) {
      try {
        pictureRound.imageLoadingStatus.set(question.id, ImageLoadStatus.LOADING);
        
        // Simulate image loading (in real implementation, this would load actual images)
        await this.loadImage(question.imageUrl);
        
        pictureRound.imageLoadingStatus.set(question.id, ImageLoadStatus.LOADED);
        
        this.emitEvent(SpecialRoundEventType.IMAGE_LOADED, {
          roundId: pictureRound.id,
          specialType: SpecialRoundType.PICTURE,
          data: { questionId: question.id, imageUrl: question.imageUrl }
        });
        
      } catch (error) {
        pictureRound.imageLoadingStatus.set(question.id, ImageLoadStatus.ERROR);
        
        this.emitEvent(SpecialRoundEventType.IMAGE_ERROR, {
          roundId: pictureRound.id,
          specialType: SpecialRoundType.PICTURE,
          data: { questionId: question.id, error: error.message }
        });
      }
    }
  }

  private async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.mediaCache.set(imageUrl, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
      img.src = imageUrl;
    });
  }

  // Bonus Round Management
  public async initializeBonusRound(bonusRound: BonusRound): Promise<void> {
    // Initialize participant status for all participants
    const participants = this.roundManager.getParticipants();
    
    for (const participantId of participants) {
      const status: BonusParticipantStatus = {
        participantId,
        isActive: true,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        isEliminated: false,
        bonusMultiplier: bonusRound.settings.bonusMultiplier
      };
      
      bonusRound.participantStatus.set(participantId, status);
      
      const bonusScore: BonusScore = {
        participantId,
        baseScore: 0,
        bonusPoints: 0,
        streakBonus: 0,
        timeBonus: 0,
        perfectRoundBonus: 0,
        totalBonus: 0,
        finalScore: 0
      };
      
      bonusRound.bonusScores.set(participantId, bonusScore);
    }
  }

  public async updateBonusProgress(
    participantId: string,
    isCorrect: boolean,
    timeTaken?: number
  ): Promise<void> {
    const bonusRound = this.getCurrentBonusRound();
    if (!bonusRound) {
      throw new Error('No active bonus round');
    }

    const status = bonusRound.participantStatus.get(participantId);
    const bonusScore = bonusRound.bonusScores.get(participantId);
    
    if (!status || !bonusScore) {
      throw new Error('Participant not found in bonus round');
    }

    if (status.isEliminated) {
      return; // Skip eliminated participants
    }

    // Update streak counters
    if (isCorrect) {
      status.consecutiveCorrect++;
      status.consecutiveIncorrect = 0;
      
      // Check for streak bonus
      if (bonusRound.settings.streakBonus && 
          status.consecutiveCorrect >= bonusRound.settings.streakBonusThreshold) {
        bonusScore.streakBonus += bonusRound.settings.streakBonusPoints;
        
        this.emitEvent(SpecialRoundEventType.STREAK_BONUS, {
          roundId: bonusRound.id,
          specialType: SpecialRoundType.BONUS,
          participantId,
          data: { streak: status.consecutiveCorrect, bonusPoints: bonusRound.settings.streakBonusPoints }
        });
      }
      
      // Check for time bonus
      if (bonusRound.settings.timeBonus && timeTaken && 
          timeTaken <= bonusRound.settings.timeBonusThreshold) {
        const timeBonus = Math.round(bonusScore.baseScore * (bonusRound.settings.timeBonusMultiplier - 1));
        bonusScore.timeBonus += timeBonus;
        
        this.emitEvent(SpecialRoundEventType.TIME_BONUS, {
          roundId: bonusRound.id,
          specialType: SpecialRoundType.BONUS,
          participantId,
          data: { timeTaken, bonusPoints: timeBonus }
        });
      }
      
    } else {
      status.consecutiveCorrect = 0;
      status.consecutiveIncorrect++;
      
      // Check for elimination
      if (bonusRound.settings.eliminationMode && 
          status.consecutiveIncorrect >= bonusRound.settings.eliminationThreshold) {
        status.isEliminated = true;
        status.eliminatedAt = new Date();
        
        this.emitEvent(SpecialRoundEventType.PARTICIPANT_ELIMINATED, {
          roundId: bonusRound.id,
          specialType: SpecialRoundType.BONUS,
          participantId,
          data: { eliminatedAt: status.eliminatedAt }
        });
      }
    }

    // Recalculate total bonus score
    this.recalculateBonusScore(bonusScore);
  }

  private recalculateBonusScore(bonusScore: BonusScore): void {
    bonusScore.totalBonus = bonusScore.bonusPoints + bonusScore.streakBonus + 
                           bonusScore.timeBonus + bonusScore.perfectRoundBonus;
    bonusScore.finalScore = bonusScore.baseScore + bonusScore.totalBonus;
  }

  // Lightning Round Management
  public async startLightningRound(lightningRound: LightningRound): Promise<void> {
    lightningRound.startTime = new Date();
    lightningRound.endTime = new Date(Date.now() + lightningRound.settings.totalTimeLimit * 1000);
    lightningRound.currentQuestionIndex = 0;

    // Initialize participant progress
    const participants = this.roundManager.getParticipants();
    for (const participantId of participants) {
      const progress: LightningProgress = {
        participantId,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        currentScore: 0,
        timeRemaining: lightningRound.settings.totalTimeLimit,
        isComplete: false
      };
      
      lightningRound.participantProgress.set(participantId, progress);
    }

    // Start the lightning round timer
    this.startLightningTimer(lightningRound);
  }

  private startLightningTimer(lightningRound: LightningRound): void {
    const timerId = `lightning_${lightningRound.id}`;
    const timer = setInterval(() => {
      this.updateLightningProgress(lightningRound);
    }, 1000); // Update every second
    
    this.timers.set(timerId, timer);
    
    // Set overall timeout
    setTimeout(() => {
      this.endLightningRound(lightningRound);
    }, lightningRound.settings.totalTimeLimit * 1000);
  }

  private updateLightningProgress(lightningRound: LightningRound): void {
    const now = new Date();
    const timeElapsed = (now.getTime() - lightningRound.startTime!.getTime()) / 1000;
    const timeRemaining = Math.max(0, lightningRound.settings.totalTimeLimit - timeElapsed);

    for (const [participantId, progress] of lightningRound.participantProgress) {
      if (!progress.isComplete) {
        progress.timeRemaining = timeRemaining;
        
        if (timeRemaining <= 0) {
          progress.isComplete = true;
          progress.completedAt = now;
        }
      }
    }
  }

  private async endLightningRound(lightningRound: LightningRound): Promise<void> {
    // Mark all participants as complete
    for (const [participantId, progress] of lightningRound.participantProgress) {
      if (!progress.isComplete) {
        progress.isComplete = true;
        progress.completedAt = new Date();
        
        this.emitEvent(SpecialRoundEventType.LIGHTNING_COMPLETED, {
          roundId: lightningRound.id,
          specialType: SpecialRoundType.LIGHTNING,
          participantId,
          data: { progress }
        });
      }
    }

    // Clear timer
    const timerId = `lightning_${lightningRound.id}`;
    const timer = this.timers.get(timerId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(timerId);
    }
  }

  // Utility Methods
  private isSpecialRound(round: any): round is SpecialRound {
    return round && round.type === 'special' && round.specialType;
  }

  private getCurrentWagerRound(): WagerRound | null {
    return this.currentSpecialRound?.specialType === SpecialRoundType.WAGER 
      ? this.currentSpecialRound as WagerRound 
      : null;
  }

  private getCurrentPictureRound(): PictureRound | null {
    return this.currentSpecialRound?.specialType === SpecialRoundType.PICTURE 
      ? this.currentSpecialRound as PictureRound 
      : null;
  }

  private getCurrentBonusRound(): BonusRound | null {
    return this.currentSpecialRound?.specialType === SpecialRoundType.BONUS 
      ? this.currentSpecialRound as BonusRound 
      : null;
  }

  private getCurrentLightningRound(): LightningRound | null {
    return this.currentSpecialRound?.specialType === SpecialRoundType.LIGHTNING 
      ? this.currentSpecialRound as LightningRound 
      : null;
  }

  private async initializeSpecialRound(specialRound: SpecialRound): Promise<void> {
    switch (specialRound.specialType) {
      case SpecialRoundType.WAGER:
        specialRound.wagerPhase = WagerPhase.INSTRUCTIONS;
        break;
      case SpecialRoundType.PICTURE:
        await this.preloadImages(specialRound as PictureRound);
        break;
      case SpecialRoundType.BONUS:
        await this.initializeBonusRound(specialRound as BonusRound);
        break;
      case SpecialRoundType.LIGHTNING:
        await this.startLightningRound(specialRound as LightningRound);
        break;
      // Add other round types as needed
    }
  }

  private async finalizeSpecialRound(specialRound: SpecialRound): Promise<void> {
    // Clear any active timers
    for (const [timerId, timer] of this.timers) {
      if (timerId.includes(specialRound.id)) {
        clearTimeout(timer);
        this.timers.delete(timerId);
      }
    }

    // Perform round-specific cleanup
    switch (specialRound.specialType) {
      case SpecialRoundType.BONUS:
        await this.finalizeBonusScores(specialRound as BonusRound);
        break;
      case SpecialRoundType.LIGHTNING:
        await this.finalizeLightningScores(specialRound as LightningRound);
        break;
      // Add other round types as needed
    }
  }

  private async finalizeBonusScores(bonusRound: BonusRound): Promise<void> {
    // Check for perfect round bonuses
    for (const [participantId, bonusScore] of bonusRound.bonusScores) {
      const status = bonusRound.participantStatus.get(participantId);
      if (status && !status.isEliminated && status.consecutiveCorrect === bonusRound.questions.length) {
        bonusScore.perfectRoundBonus = bonusRound.settings.perfectRoundBonus;
        this.recalculateBonusScore(bonusScore);
        
        this.emitEvent(SpecialRoundEventType.PERFECT_ROUND_BONUS, {
          roundId: bonusRound.id,
          specialType: SpecialRoundType.BONUS,
          participantId,
          data: { bonusPoints: bonusRound.settings.perfectRoundBonus }
        });
      }
    }
  }

  private async finalizeLightningScores(lightningRound: LightningRound): Promise<void> {
    // Calculate final scores and update score manager
    for (const [participantId, progress] of lightningRound.participantProgress) {
      const finalScore = progress.currentScore;
      // await this.scoreManager.updatePlayerScore(participantId, finalScore);
    }
  }

  private validateSpecialRound(specialRound: SpecialRound): SpecialRoundValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!specialRound.id) {
      errors.push('Round ID is required');
    }

    if (!specialRound.specialType) {
      errors.push('Special round type is required');
    }

    // Type-specific validation
    switch (specialRound.specialType) {
      case SpecialRoundType.WAGER:
        this.validateWagerRound(specialRound as WagerRound, errors, warnings);
        break;
      case SpecialRoundType.PICTURE:
        this.validatePictureRound(specialRound as PictureRound, errors, warnings);
        break;
      // Add other validations as needed
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateWagerRound(wagerRound: WagerRound, errors: string[], warnings: string[]): void {
    const settings = wagerRound.settings;
    
    if (settings.minWager < 0) {
      errors.push('Minimum wager cannot be negative');
    }
    
    if (settings.maxWager <= settings.minWager) {
      errors.push('Maximum wager must be greater than minimum wager');
    }
    
    if (settings.wagerTimeLimit <= 0) {
      errors.push('Wager time limit must be positive');
    }
    
    if (settings.questionTimeLimit <= 0) {
      errors.push('Question time limit must be positive');
    }
  }

  private validatePictureRound(pictureRound: PictureRound, errors: string[], warnings: string[]): void {
    if (pictureRound.questions.length === 0) {
      errors.push('Picture round must have at least one question');
    }
    
    for (const question of pictureRound.questions) {
      if (!question.imageUrl) {
        errors.push(`Question ${question.id} is missing image URL`);
      }
      
      if (!question.imageAlt) {
        warnings.push(`Question ${question.id} is missing alt text for accessibility`);
      }
    }
  }

  private handleSpecialRoundStart(round: SpecialRound): void {
    this.currentSpecialRound = round;
  }

  private handleSpecialRoundEnd(): void {
    if (this.currentSpecialRound) {
      this.finalizeSpecialRound(this.currentSpecialRound);
      this.currentSpecialRound = null;
    }
  }

  // Event System
  public addEventListener(type: SpecialRoundEventType, listener: SpecialRoundEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: SpecialRoundEventType, listener: SpecialRoundEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public removeAllEventListeners(type?: SpecialRoundEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  private emitEvent(type: SpecialRoundEventType, data: Partial<SpecialRoundEvent>): void {
    const event: SpecialRoundEvent = {
      type,
      roundId: data.roundId!,
      specialType: data.specialType!,
      timestamp: new Date(),
      participantId: data.participantId,
      teamId: data.teamId,
      data: data.data
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in special round event listener for ${type}:`, error);
        }
      });
    }
  }

  // Getters
  public getCurrentSpecialRound(): SpecialRound | null {
    return this.currentSpecialRound;
  }

  public getSpecialRoundConfig(type: SpecialRoundType): SpecialRoundConfig | undefined {
    return this.specialRoundConfigs.get(type);
  }

  public getAllSpecialRoundConfigs(): Map<SpecialRoundType, SpecialRoundConfig> {
    return new Map(this.specialRoundConfigs);
  }

  public getSpecialRoundMetrics(roundId: string): SpecialRoundMetrics | null {
    // This would calculate and return metrics for a completed special round
    // Implementation would depend on stored round data
    return null;
  }

  // Configuration
  public updateSpecialRoundConfig(type: SpecialRoundType, config: Partial<SpecialRoundConfig>): void {
    const existingConfig = this.specialRoundConfigs.get(type);
    if (existingConfig) {
      this.specialRoundConfigs.set(type, { ...existingConfig, ...config });
    }
  }

  // Cleanup
  public destroy(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Clear media cache
    this.mediaCache.clear();

    // Remove all event listeners
    this.listeners.clear();

    // Reset state
    this.currentSpecialRound = null;
  }
} 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SocialService } from '../services/socialService';
import { ReactionPicker } from '../components/social/ReactionPicker';
import { ReactionDisplay } from '../components/social/ReactionDisplay';
import { FriendsList } from '../components/social/FriendsList';
import { ActivityFeed } from '../components/social/ActivityFeed';
import { ShareButton } from '../components/social/ShareButton';
import type { Reaction, UserRelationship, SocialActivity } from '../types/social';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn()
    }))
  }
}));

describe('Social Features', () => {
  describe('ReactionPicker', () => {
    it('should display trigger button', () => {
      render(
        <ReactionPicker
          onReaction={vi.fn()}
          currentReaction={undefined}
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should open reaction menu on click', async () => {
      render(
        <ReactionPicker
          onReaction={vi.fn()}
          currentReaction={undefined}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        // Check if all reaction types are displayed
        expect(screen.getByText('👍')).toBeInTheDocument();
        expect(screen.getByText('❤️')).toBeInTheDocument();
        expect(screen.getByText('😂')).toBeInTheDocument();
      });
    });

    it('should call onReaction when emoji is selected', async () => {
      const onReaction = vi.fn();
      render(
        <ReactionPicker
          onReaction={onReaction}
          currentReaction={undefined}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const likeButton = screen.getByText('👍');
        fireEvent.click(likeButton);
      });
      
      expect(onReaction).toHaveBeenCalledWith('like');
    });
  });

  describe('ReactionDisplay', () => {
    const mockReactions: Reaction[] = [
      {
        id: '1',
        user_id: 'user1',
        game_room_id: 'room1',
        target_type: 'game_moment',
        target_id: 'moment1',
        reaction_type: 'fire',
        created_at: new Date().toISOString(),
        user: { display_name: 'Alice' }
      },
      {
        id: '2',
        user_id: 'user2',
        game_room_id: 'room1',
        target_type: 'game_moment',
        target_id: 'moment1',
        reaction_type: 'fire',
        created_at: new Date().toISOString(),
        user: { display_name: 'Bob' }
      }
    ];

    it('should display reaction counts', () => {
      render(
        <ReactionDisplay
          reactions={mockReactions}
          currentUserReaction={undefined}
        />
      );
      
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('2 reactions')).toBeInTheDocument();
    });

    it('should group reactions by type', () => {
      const mixedReactions: Reaction[] = [
        ...mockReactions,
        {
          id: '3',
          user_id: 'user3',
          game_room_id: 'room1',
          target_type: 'game_moment',
          target_id: 'moment1',
          reaction_type: 'clap',
          created_at: new Date().toISOString(),
          user: { display_name: 'Charlie' }
        }
      ];

      render(
        <ReactionDisplay
          reactions={mixedReactions}
          currentUserReaction={undefined}
        />
      );
      
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('👏')).toBeInTheDocument();
      expect(screen.getByText('3 reactions')).toBeInTheDocument();
    });
  });

  describe('ShareButton', () => {
    it('should display share button', () => {
      render(
        <ShareButton
          title="Test Share"
          text="Test text"
          score={100}
        />
      );
      
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should open share options on click', async () => {
      render(
        <ShareButton
          title="Test Share"
          text="Test text"
          score={100}
        />
      );
      
      const button = screen.getByText('Share');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Share your result')).toBeInTheDocument();
        expect(screen.getByText('Twitter')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Copy link')).toBeInTheDocument();
      });
    });

    it('should copy to clipboard when copy link is clicked', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      render(
        <ShareButton
          title="Test Share"
          text="Test text"
          score={100}
        />
      );
      
      const button = screen.getByText('Share');
      fireEvent.click(button);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy link');
        fireEvent.click(copyButton);
      });
      
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('SocialService', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should add a reaction', async () => {
      const mockReaction: Reaction = {
        id: 'test-id',
        user_id: 'test-user-id',
        game_room_id: 'room1',
        target_type: 'game_moment',
        target_id: 'moment1',
        reaction_type: 'fire',
        created_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReaction, error: null })
      } as any);

      const result = await SocialService.addReaction({
        gameRoomId: 'room1',
        targetType: 'game_moment',
        targetId: 'moment1',
        reactionType: 'fire'
      });

      expect(result).toEqual(mockReaction);
    });

    it('should send a friend request', async () => {
      const mockRelationship: UserRelationship = {
        id: 'test-id',
        user_id: 'test-user-id',
        target_user_id: 'target-user-id',
        relationship_type: 'friend',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockRelationship, error: null })
      } as any);

      const result = await SocialService.sendFriendRequest('target-user-id');

      expect(result).toEqual(mockRelationship);
    });

    it('should create an activity', async () => {
      const mockActivity: SocialActivity = {
        id: 'test-id',
        user_id: 'test-user-id',
        activity_type: 'game_won',
        activity_data: { score: 100 },
        visibility: 'friends',
        created_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockActivity, error: null })
      } as any);

      const result = await SocialService.createActivity({
        activityType: 'game_won',
        activityData: { score: 100 }
      });

      expect(result).toEqual(mockActivity);
    });
  });
});
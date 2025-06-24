import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/database';
import { supabase } from '../services/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useProfanityFilter } from './useProfanityFilter';

interface UseChatMessagesReturn {
  messages: ChatMessage[];
  sendMessage: (message: Partial<ChatMessage>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  connectionState: {
    isConnected: boolean;
    isSubscribed: boolean;
  };
}

export function useChatMessages(
  gameRoomId: string,
  teamId?: string
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { filterText } = useProfanityFilter();

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const query = supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          ),
          teams:team_id (
            id,
            name
          )
        `)
        .eq('game_room_id', gameRoomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match our ChatMessage interface
      const transformedMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        user: msg.profiles ? {
          display_name: msg.profiles.display_name,
          avatar_url: msg.profiles.avatar_url
        } : undefined,
        team: msg.teams ? {
          name: msg.teams.name
        } : undefined
      }));

      setMessages(transformedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [gameRoomId]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new as ChatMessage;
      
      // Fetch user and team data for the new message
      const fetchMessageDetails = async () => {
        const { data } = await supabase
          .from('chat_messages')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              avatar_url
            ),
            teams:team_id (
              id,
              name
            )
          `)
          .eq('id', newMessage.id)
          .single();

        if (data) {
          const transformedMessage: ChatMessage = {
            ...data,
            user: data.profiles ? {
              display_name: data.profiles.display_name,
              avatar_url: data.profiles.avatar_url
            } : undefined,
            team: data.teams ? {
              name: data.teams.name
            } : undefined
          };

          setMessages(prev => [...prev, transformedMessage]);
        }
      };

      fetchMessageDetails();
    } else if (payload.eventType === 'UPDATE') {
      const updatedMessage = payload.new as ChatMessage;
      setMessages(prev => 
        prev.map(msg => 
          msg.id === updatedMessage.id 
            ? { ...msg, ...updatedMessage } 
            : msg
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setMessages(prev => 
        prev.filter(msg => msg.id !== payload.old.id)
      );
    }
  }, []);

  // Set up real-time subscription
  const { state: connectionState } = useRealtimeSubscription(
    {
      table: 'chat_messages',
      event: '*',
      filter: `game_room_id=eq.${gameRoomId}`,
    },
    handleRealtimeUpdate,
    [gameRoomId]
  );

  // Send a new message
  const sendMessage = useCallback(async (messageData: Partial<ChatMessage>) => {
    try {
      // Filter message for profanity
      const filteredMessage = filterText(messageData.message || '');
      
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert([{
          ...messageData,
          message: filteredMessage,
          is_deleted: false,
        }]);

      if (insertError) {
        throw insertError;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err as Error);
      throw err;
    }
  }, [filterText]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    connectionState,
  };
}
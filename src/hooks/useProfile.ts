import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../types/profile';
import ProfileService from '../services/profileService';

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useProfile(profileId?: string): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  const loadProfile = useCallback(async (id?: string) => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // For demo, use mock data
      const isGuest = id.includes('guest');
      const profileData = ProfileService.createMockProfile(isGuest);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      setError(null);
      const updatedProfile = await ProfileService.updateProfile(profile.id, updates);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, [profile]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile) return;

    try {
      setError(null);
      const avatarUrl = await ProfileService.uploadAvatar(file);
      await updateProfile({ avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      throw err;
    }
  }, [profile, updateProfile]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (profile) {
      await loadProfile(profile.id);
    }
  }, [profile, loadProfile]);

  // Load profile on mount or when profileId changes
  useEffect(() => {
    loadProfile(profileId);
  }, [profileId, loadProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refreshProfile
  };
}

export default useProfile; 
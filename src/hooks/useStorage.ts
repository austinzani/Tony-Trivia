import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { 
  StorageService, 
  StorageBucket, 
  FileUploadOptions, 
  FileDownloadOptions,
  SignedUrlOptions,
  FileMetadata,
  UploadProgressCallback,
  storageUtils
} from '../services/storageService';
import { useAuth } from './useAuth';

// Storage query keys
export const storageKeys = {
  all: ['storage'] as const,
  buckets: () => [...storageKeys.all, 'buckets'] as const,
  bucket: (bucket: StorageBucket) => [...storageKeys.buckets(), bucket] as const,
  files: (bucket: StorageBucket, path: string) => [...storageKeys.bucket(bucket), 'files', path] as const,
  file: (bucket: StorageBucket, path: string) => [...storageKeys.bucket(bucket), 'file', path] as const,
  signedUrl: (bucket: StorageBucket, path: string) => [...storageKeys.bucket(bucket), 'signed-url', path] as const,
};

// File upload hook with progress tracking
export function useFileUpload() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadMutation = useMutation({
    mutationFn: async ({ 
      uploadOptions, 
      withProgress = false 
    }: { 
      uploadOptions: FileUploadOptions; 
      withProgress?: boolean;
    }) => {
      if (withProgress) {
        const onProgress: UploadProgressCallback = (progress) => {
          setUploadProgress(progress);
        };
        return StorageService.uploadFileWithProgress(uploadOptions, onProgress);
      } else {
        return StorageService.uploadFile(uploadOptions);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.bucket(variables.uploadOptions.bucket) 
      });
      setUploadProgress(0);
    },
    onError: () => {
      setUploadProgress(0);
    }
  });

  const uploadFile = useCallback((
    uploadOptions: FileUploadOptions, 
    withProgress: boolean = false
  ) => {
    return uploadMutation.mutate({ uploadOptions, withProgress });
  }, [uploadMutation]);

  return {
    uploadFile,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadProgress,
    reset: uploadMutation.reset
  };
}

// File download hook
export function useFileDownload() {
  const downloadMutation = useMutation({
    mutationFn: StorageService.downloadFile,
  });

  const downloadFile = useCallback((options: FileDownloadOptions) => {
    return downloadMutation.mutateAsync(options);
  }, [downloadMutation]);

  return {
    downloadFile,
    isDownloading: downloadMutation.isPending,
    downloadError: downloadMutation.error
  };
}

// File list hook
export function useFileList(
  bucket: StorageBucket,
  path: string = '',
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: storageKeys.files(bucket, path),
    queryFn: () => StorageService.listFiles(bucket, path, options),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// File info hook
export function useFileInfo(bucket: StorageBucket, path: string, enabled: boolean = true) {
  return useQuery({
    queryKey: storageKeys.file(bucket, path),
    queryFn: () => StorageService.getFileInfo(bucket, path),
    enabled: enabled && !!path,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Signed URL hook for private files
export function useSignedUrl(
  bucket: StorageBucket, 
  path: string, 
  expiresIn: number = 3600,
  options?: {
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    };
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: storageKeys.signedUrl(bucket, path),
    queryFn: () => StorageService.createSignedUrl({
      bucket,
      path,
      expiresIn,
      transform: options?.transform
    }),
    enabled: options?.enabled !== false && !!path,
    staleTime: (expiresIn * 1000) - (5 * 60 * 1000), // Refresh 5 minutes before expiry
  });
}

// File operations hook (delete, move, copy)
export function useFileOperations() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: ({ bucket, paths }: { bucket: StorageBucket; paths: string[] }) =>
      StorageService.deleteFile(bucket, paths),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.bucket(variables.bucket) 
      });
    }
  });

  const moveMutation = useMutation({
    mutationFn: ({ 
      bucket, 
      fromPath, 
      toPath, 
      destinationBucket 
    }: { 
      bucket: StorageBucket; 
      fromPath: string; 
      toPath: string; 
      destinationBucket?: StorageBucket;
    }) => StorageService.moveFile(bucket, fromPath, toPath, { destinationBucket }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.bucket(variables.bucket) 
      });
      if (variables.destinationBucket) {
        queryClient.invalidateQueries({ 
          queryKey: storageKeys.bucket(variables.destinationBucket) 
        });
      }
    }
  });

  const copyMutation = useMutation({
    mutationFn: ({ 
      bucket, 
      fromPath, 
      toPath, 
      destinationBucket 
    }: { 
      bucket: StorageBucket; 
      fromPath: string; 
      toPath: string; 
      destinationBucket?: StorageBucket;
    }) => StorageService.copyFile(bucket, fromPath, toPath, { destinationBucket }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.bucket(variables.bucket) 
      });
      if (variables.destinationBucket) {
        queryClient.invalidateQueries({ 
          queryKey: storageKeys.bucket(variables.destinationBucket) 
        });
      }
    }
  });

  return {
    deleteFile: deleteMutation.mutate,
    moveFile: moveMutation.mutate,
    copyFile: copyMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isMoving: moveMutation.isPending,
    isCopying: copyMutation.isPending,
    deleteError: deleteMutation.error,
    moveError: moveMutation.error,
    copyError: copyMutation.error
  };
}

// User avatar hook
export function useUserAvatar(userId?: string) {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;
  const queryClient = useQueryClient();

  const avatarQuery = useFileList(
    'user-avatars',
    currentUserId || '',
    { enabled: !!currentUserId }
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentUserId) throw new Error('User not authenticated');
      
      const path = storageUtils.generateAvatarPath(currentUserId, file.name);
      return StorageService.uploadFile({
        bucket: 'user-avatars',
        path,
        file,
        options: { upsert: true }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.files('user-avatars', currentUserId || '') 
      });
    }
  });

  const getAvatarUrl = useCallback((fileName?: string) => {
    if (!currentUserId || !fileName) return null;
    
    const path = `${currentUserId}/avatar/${fileName}`;
    return StorageService.createSignedUrl({
      bucket: 'user-avatars',
      path,
      expiresIn: 3600,
      transform: { width: 200, height: 200, quality: 80 }
    });
  }, [currentUserId]);

  return {
    avatars: avatarQuery.data?.data || [],
    isLoading: avatarQuery.isLoading,
    error: avatarQuery.error,
    uploadAvatar: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getAvatarUrl
  };
}

// Team logo hook
export function useTeamLogo(teamId: string) {
  const queryClient = useQueryClient();

  const logoQuery = useFileList(
    'team-logos',
    teamId,
    { enabled: !!teamId }
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const path = storageUtils.generateTeamLogoPath(teamId, file.name);
      return StorageService.uploadFile({
        bucket: 'team-logos',
        path,
        file,
        options: { upsert: true }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.files('team-logos', teamId) 
      });
    }
  });

  const getLogoUrl = useCallback((fileName?: string) => {
    if (!teamId || !fileName) return null;
    
    const path = `${teamId}/${fileName}`;
    return StorageService.createSignedUrl({
      bucket: 'team-logos',
      path,
      expiresIn: 3600,
      transform: { width: 300, height: 300, quality: 85 }
    });
  }, [teamId]);

  return {
    logos: logoQuery.data?.data || [],
    isLoading: logoQuery.isLoading,
    error: logoQuery.error,
    uploadLogo: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getLogoUrl
  };
}

// Question media hook
export function useQuestionMedia(questionId?: string) {
  const queryClient = useQueryClient();

  const mediaQuery = useFileList(
    'question-media',
    questionId ? `questions/${questionId}` : '',
    { enabled: !!questionId }
  );

  const uploadMutation = useMutation({
    mutationFn: async ({ file, questionId: qId }: { file: File; questionId: string }) => {
      const path = storageUtils.generateQuestionMediaPath(qId, file.name);
      return StorageService.uploadFile({
        bucket: 'question-media',
        path,
        file
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.files('question-media', `questions/${variables.questionId}`) 
      });
    }
  });

  const getMediaUrl = useCallback((questionId: string, fileName: string, transform?: {
    width?: number;
    height?: number;
    quality?: number;
  }) => {
    const path = `questions/${questionId}/${fileName}`;
    return StorageService.getPublicUrl('question-media', path, transform);
  }, []);

  return {
    media: mediaQuery.data?.data || [],
    isLoading: mediaQuery.isLoading,
    error: mediaQuery.error,
    uploadMedia: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getMediaUrl
  };
}

// Game assets hook
export function useGameAssets(category?: string) {
  const queryClient = useQueryClient();

  const assetsQuery = useFileList(
    'game-assets',
    category || '',
    { enabled: true }
  );

  const uploadMutation = useMutation({
    mutationFn: async ({ file, category: cat }: { file: File; category: string }) => {
      const path = storageUtils.generateGameAssetPath(cat, file.name);
      return StorageService.uploadFile({
        bucket: 'game-assets',
        path,
        file
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: storageKeys.files('game-assets', variables.category) 
      });
    }
  });

  const getAssetUrl = useCallback((category: string, fileName: string, transform?: {
    width?: number;
    height?: number;
    quality?: number;
  }) => {
    const path = `${category}/${fileName}`;
    return StorageService.getPublicUrl('game-assets', path, transform);
  }, []);

  return {
    assets: assetsQuery.data?.data || [],
    isLoading: assetsQuery.isLoading,
    error: assetsQuery.error,
    uploadAsset: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    getAssetUrl
  };
}

// Temporary files cleanup hook
export function useTempFileCleanup() {
  const { user } = useAuth();

  const cleanupMutation = useMutation({
    mutationFn: (olderThanHours: number = 24) => {
      if (!user?.id) throw new Error('User not authenticated');
      return StorageService.cleanupTempFiles(user.id, olderThanHours);
    }
  });

  return {
    cleanupTempFiles: cleanupMutation.mutate,
    isCleaningUp: cleanupMutation.isPending,
    cleanupError: cleanupMutation.error
  };
}

// Storage utilities hook
export function useStorageUtils() {
  return {
    validateFile: StorageService.validateFile,
    generateFilePath: StorageService.generateFilePath,
    formatFileSize: storageUtils.formatFileSize,
    getFileExtension: storageUtils.getFileExtension,
    isImageFile: storageUtils.isImageFile,
    isVideoFile: storageUtils.isVideoFile,
    isAudioFile: storageUtils.isAudioFile
  };
} 
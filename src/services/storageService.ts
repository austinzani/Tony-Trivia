import { supabase } from '../lib/supabase';
import { StorageError } from '@supabase/storage-js';

// Storage bucket types
export type StorageBucket = 
  | 'user-avatars'
  | 'game-assets'
  | 'question-media'
  | 'team-logos'
  | 'temp-uploads';

// File upload options
export interface FileUploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File;
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  };
}

// File download options
export interface FileDownloadOptions {
  bucket: StorageBucket;
  path: string;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

// Signed URL options
export interface SignedUrlOptions {
  bucket: StorageBucket;
  path: string;
  expiresIn: number; // seconds
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  };
}

// File metadata interface
export interface FileMetadata {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

// Upload progress callback
export type UploadProgressCallback = (progress: number) => void;

// Storage service class
export class StorageService {
  // File validation
  static validateFile(file: File, bucket: StorageBucket): { valid: boolean; error?: string } {
    const maxSizes: Record<StorageBucket, number> = {
      'user-avatars': 5 * 1024 * 1024, // 5MB
      'game-assets': 50 * 1024 * 1024, // 50MB
      'question-media': 100 * 1024 * 1024, // 100MB
      'team-logos': 2 * 1024 * 1024, // 2MB
      'temp-uploads': 10 * 1024 * 1024, // 10MB
    };

    const allowedTypes: Record<StorageBucket, string[]> = {
      'user-avatars': ['image/jpeg', 'image/png', 'image/webp'],
      'game-assets': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'],
      'question-media': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'],
      'team-logos': ['image/jpeg', 'image/png', 'image/webp'],
      'temp-uploads': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'],
    };

    const maxSize = maxSizes[bucket];
    const allowedTypesForBucket = allowedTypes[bucket];

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds limit of ${(maxSize / (1024 * 1024)).toFixed(1)}MB` 
      };
    }

    if (!allowedTypesForBucket.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} not allowed for this bucket` 
      };
    }

    return { valid: true };
  }

  // Generate safe file path
  static generateFilePath(userId: string, folder: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${folder}/${timestamp}_${sanitizedFileName}`;
  }

  // Upload file
  static async uploadFile({
    bucket,
    path,
    file,
    options = {}
  }: FileUploadOptions): Promise<{ data: any; error: StorageError | null }> {
    try {
      // Validate file
      const validation = this.validateFile(file, bucket);
      if (!validation.valid) {
        return {
          data: null,
          error: new Error(validation.error) as StorageError
        };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options.cacheControl || '3600',
          contentType: options.contentType || file.type,
          upsert: options.upsert || false,
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Upload with progress tracking
  static async uploadFileWithProgress(
    uploadOptions: FileUploadOptions,
    onProgress?: UploadProgressCallback
  ): Promise<{ data: any; error: StorageError | null }> {
    try {
      // For now, we'll simulate progress since Supabase doesn't provide built-in progress tracking
      // In a real implementation, you might use XMLHttpRequest or a custom upload method
      
      if (onProgress) {
        onProgress(0);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          // This is a simulation - in practice you'd get real progress from the upload
        }, 100);

        const result = await this.uploadFile(uploadOptions);
        
        clearInterval(progressInterval);
        onProgress(100);
        
        return result;
      } else {
        return await this.uploadFile(uploadOptions);
      }
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Download file
  static async downloadFile({
    bucket,
    path,
    transform
  }: FileDownloadOptions): Promise<{ data: Blob | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path, {
          transform: transform
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Get public URL
  static getPublicUrl(bucket: StorageBucket, path: string, transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): { data: { publicUrl: string } } {
    return supabase.storage
      .from(bucket)
      .getPublicUrl(path, {
        transform: transform
      });
  }

  // Create signed URL for private buckets
  static async createSignedUrl({
    bucket,
    path,
    expiresIn,
    transform
  }: SignedUrlOptions): Promise<{ data: { signedUrl: string } | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, {
          transform: transform
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // List files in bucket
  static async listFiles(
    bucket: StorageBucket,
    path: string = '',
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<{ data: FileMetadata[] | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          sortBy: options?.sortBy || { column: 'name', order: 'asc' }
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Delete file
  static async deleteFile(
    bucket: StorageBucket,
    paths: string[]
  ): Promise<{ data: any; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Move file
  static async moveFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string,
    options?: { destinationBucket?: StorageBucket }
  ): Promise<{ data: any; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath, {
          destinationBucket: options?.destinationBucket
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Copy file
  static async copyFile(
    bucket: StorageBucket,
    fromPath: string,
    toPath: string,
    options?: { destinationBucket?: StorageBucket }
  ): Promise<{ data: any; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath, {
          destinationBucket: options?.destinationBucket
        });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }

  // Cleanup temporary files
  static async cleanupTempFiles(userId: string, olderThanHours: number = 24): Promise<void> {
    try {
      const { data: files, error } = await this.listFiles('temp-uploads', userId);
      
      if (error || !files) return;

      const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
      const filesToDelete = files
        .filter(file => new Date(file.created_at) < cutoffTime)
        .map(file => file.name);

      if (filesToDelete.length > 0) {
        await this.deleteFile('temp-uploads', filesToDelete);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Get file info
  static async getFileInfo(
    bucket: StorageBucket,
    path: string
  ): Promise<{ data: FileMetadata | null; error: StorageError | null }> {
    try {
      // Get file list with the specific path
      const { data: files, error } = await this.listFiles(bucket, path);
      
      if (error || !files || files.length === 0) {
        return { data: null, error: error || new Error('File not found') as StorageError };
      }

      return { data: files[0], error: null };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError
      };
    }
  }
}

// Utility functions for common operations
export const storageUtils = {
  // Generate avatar path for user
  generateAvatarPath: (userId: string, fileName: string): string => {
    return StorageService.generateFilePath(userId, 'avatar', fileName);
  },

  // Generate team logo path
  generateTeamLogoPath: (teamId: string, fileName: string): string => {
    return `${teamId}/${fileName}`;
  },

  // Generate question media path
  generateQuestionMediaPath: (questionId: string, fileName: string): string => {
    return `questions/${questionId}/${fileName}`;
  },

  // Generate game asset path
  generateGameAssetPath: (category: string, fileName: string): string => {
    return `${category}/${fileName}`;
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  // Check if file is image
  isImageFile: (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  },

  // Check if file is video
  isVideoFile: (mimeType: string): boolean => {
    return mimeType.startsWith('video/');
  },

  // Check if file is audio
  isAudioFile: (mimeType: string): boolean => {
    return mimeType.startsWith('audio/');
  }
};

export default StorageService; 
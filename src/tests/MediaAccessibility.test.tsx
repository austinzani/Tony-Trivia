import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import QuestionDisplay from '../components/game/QuestionDisplay';
import { ImageRenderer, AudioRenderer, VideoRenderer } from '../components/game/MediaRenderer';
import { Question } from '../types/game';

// Mock media URL validation
global.URL.createObjectURL = jest.fn(() => 'mock-url');

describe('Media Accessibility Features', () => {
  const mockQuestion: Question = {
    id: '1',
    text: 'What is shown in this image?',
    type: 'image',
    category: 'Geography',
    difficulty: 'medium',
    correctAnswer: 'Mount Everest',
    mediaUrl: 'https://example.com/mountain.jpg',
    mediaType: 'image',
    altText: 'A snow-capped mountain peak rising above clouds',
    points: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('Image Accessibility', () => {
    it('should render image with proper alt text', () => {
      render(<QuestionDisplay question={mockQuestion} />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'A snow-capped mountain peak rising above clouds');
    });

    it('should use fallback alt text when not provided', () => {
      const questionWithoutAlt = { ...mockQuestion, altText: undefined };
      render(<QuestionDisplay question={questionWithoutAlt} />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Question 1 image');
    });

    it('should have proper ARIA attributes on image', () => {
      const { container } = render(
        <ImageRenderer 
          url="https://example.com/test.jpg" 
          alt="Test image description"
        />
      );
      const image = container.querySelector('img');
      expect(image).toHaveAttribute('role', 'img');
      expect(image).toHaveAttribute('aria-label', 'Test image description');
    });
  });

  describe('Audio Accessibility', () => {
    const audioQuestion: Question = {
      ...mockQuestion,
      type: 'audio',
      mediaUrl: 'https://example.com/audio.mp3',
      mediaType: 'audio',
      transcript: 'This is the audio transcript for accessibility.',
    };

    it('should render audio with transcript', () => {
      render(<QuestionDisplay question={audioQuestion} />);
      expect(screen.getByText('Audio Transcript')).toBeInTheDocument();
    });

    it('should toggle transcript visibility', async () => {
      render(<QuestionDisplay question={audioQuestion} />);
      const transcriptSummary = screen.getByText('Audio Transcript');
      
      // Initially transcript content should not be visible
      expect(screen.queryByText('This is the audio transcript for accessibility.')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(transcriptSummary);
      
      // Now transcript should be visible
      await waitFor(() => {
        expect(screen.getByText('This is the audio transcript for accessibility.')).toBeInTheDocument();
      });
    });

    it('should display keyboard shortcuts hint', () => {
      const { container } = render(
        <AudioRenderer url="https://example.com/audio.mp3" />
      );
      expect(screen.getByText(/Space \(play\/pause\)/)).toBeInTheDocument();
    });

    it('should have proper ARIA labels on audio controls', () => {
      const { container } = render(
        <AudioRenderer url="https://example.com/audio.mp3" />
      );
      
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
      expect(screen.getByLabelText('Restart')).toBeInTheDocument();
      expect(screen.getByLabelText('Mute')).toBeInTheDocument();
      expect(screen.getByLabelText('Audio progress')).toBeInTheDocument();
    });

    it('should respond to keyboard navigation', async () => {
      const mockPlay = jest.fn();
      const mockPause = jest.fn();
      
      const { container } = render(
        <AudioRenderer 
          url="https://example.com/audio.mp3"
          onPlay={mockPlay}
          onPause={mockPause}
        />
      );
      
      // Simulate space key press
      fireEvent.keyDown(window, { key: ' ' });
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('Video Accessibility', () => {
    const videoQuestion: Question = {
      ...mockQuestion,
      type: 'video',
      mediaUrl: 'https://example.com/video.mp4',
      mediaType: 'video',
      transcript: 'This is the video transcript.',
      captions: 'https://example.com/captions.vtt',
    };

    it('should render video with captions track', () => {
      const { container } = render(<QuestionDisplay question={videoQuestion} />);
      const track = container.querySelector('track');
      expect(track).toHaveAttribute('kind', 'captions');
      expect(track).toHaveAttribute('src', 'https://example.com/captions.vtt');
      expect(track).toHaveAttribute('label', 'English captions');
    });

    it('should render video transcript', () => {
      render(<QuestionDisplay question={videoQuestion} />);
      expect(screen.getByText('Video Transcript')).toBeInTheDocument();
    });

    it('should have proper ARIA label on video element', () => {
      const { container } = render(
        <VideoRenderer url="https://example.com/video.mp4" />
      );
      const video = container.querySelector('video');
      expect(video).toHaveAttribute('aria-label', 'Video content');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes to media containers', () => {
      const { container } = render(<QuestionDisplay question={mockQuestion} />);
      const mediaContainer = container.querySelector('.w-full.max-w-2xl.mx-auto');
      expect(mediaContainer).toBeInTheDocument();
    });

    it('should have mobile-friendly touch targets', () => {
      const { container } = render(
        <AudioRenderer url="https://example.com/audio.mp3" />
      );
      
      const playButton = screen.getByLabelText('Play');
      const styles = window.getComputedStyle(playButton);
      
      // Check minimum touch target size (44px)
      expect(playButton).toHaveClass('w-12', 'h-12'); // 48px x 48px
    });
  });

  describe('Loading and Error States', () => {
    it('should announce loading state to screen readers', () => {
      const { container } = render(
        <ImageRenderer url="https://example.com/slow-image.jpg" />
      );
      expect(screen.getByText('Loading image...')).toBeInTheDocument();
    });

    it('should display accessible error messages', async () => {
      const mockError = jest.fn();
      const { container } = render(
        <ImageRenderer 
          url="https://example.com/broken.jpg" 
          onError={mockError}
        />
      );
      
      // Simulate image load error
      const img = container.querySelector('img');
      fireEvent.error(img!);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load image')).toBeInTheDocument();
        expect(mockError).toHaveBeenCalledWith('Failed to load image');
      });
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should include screen reader only instructions', () => {
      const { container } = render(
        <AudioRenderer url="https://example.com/audio.mp3" />
      );
      
      const srOnly = container.querySelector('.sr-only');
      expect(srOnly).toHaveTextContent('Keyboard shortcuts:');
    });

    it('should properly structure question metadata for screen readers', () => {
      render(<QuestionDisplay question={mockQuestion} />);
      
      // Check category badge
      expect(screen.getByText('Geography')).toBeInTheDocument();
      
      // Check difficulty badge
      expect(screen.getByText('Medium')).toBeInTheDocument();
      
      // Check points badge
      expect(screen.getByText('3 pts')).toBeInTheDocument();
    });
  });
});
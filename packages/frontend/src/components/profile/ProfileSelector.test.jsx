/**
 * Tests for ProfileSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileSelector } from './ProfileSelector';

describe('ProfileSelector', () => {
  const mockProfiles = [
    {
      id: '5yo-girl',
      age: 5,
      gender: 'girl',
      displayName: '5 year old girl',
      complexityLevel: 'simple',
      vocabularyStyle: 'girl-typical',
    },
    {
      id: '8yo-boy',
      age: 8,
      gender: 'boy',
      displayName: '8 year old boy',
      complexityLevel: 'moderate',
      vocabularyStyle: 'boy-typical',
    },
    {
      id: '11yo-boy',
      age: 11,
      gender: 'boy',
      displayName: '11 year old boy',
      complexityLevel: 'advanced',
      vocabularyStyle: 'boy-typical',
    },
  ];

  const mockOnSelectProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title', () => {
      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      expect(screen.getByText('Who is asking?')).toBeInTheDocument();
    });

    it('should render all profile cards', () => {
      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      expect(screen.getByText('5 year old girl')).toBeInTheDocument();
      expect(screen.getByText('8 year old boy')).toBeInTheDocument();
      expect(screen.getByText('11 year old boy')).toBeInTheDocument();
    });

    it('should render with active profile', () => {
      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={mockProfiles[1]}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      const selectedCard = screen.getByText('8 year old boy').closest('div');
      expect(selectedCard).toBeInTheDocument();
    });

    it('should render with no profiles', () => {
      render(
        <ProfileSelector
          profiles={[]}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      expect(screen.getByText('Who is asking?')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectProfile when card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      const profile = mockProfiles[0];
      const card = screen.getByText(profile.displayName);

      await user.click(card);

      // ProfileCard passes profile.id to onSelectProfile
      expect(mockOnSelectProfile).toHaveBeenCalledWith(profile.id);
    });

    it('should allow selecting different profiles', async () => {
      const user = userEvent.setup();

      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      // Select first profile
      await user.click(screen.getByText('5 year old girl'));
      expect(mockOnSelectProfile).toHaveBeenCalledWith(mockProfiles[0].id);

      // Select second profile
      await user.click(screen.getByText('8 year old boy'));
      expect(mockOnSelectProfile).toHaveBeenCalledWith(mockProfiles[1].id);

      expect(mockOnSelectProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe('profile display', () => {
    it('should show each profile key', () => {
      render(
        <ProfileSelector
          profiles={mockProfiles}
          activeProfile={null}
          onSelectProfile={mockOnSelectProfile}
        />
      );

      mockProfiles.forEach((profile) => {
        const card = screen.getByText(profile.displayName);
        expect(card).toBeInTheDocument();
      });
    });
  });
});

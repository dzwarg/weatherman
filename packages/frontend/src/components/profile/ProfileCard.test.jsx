/**
 * Integration tests for ProfileCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileCard } from './ProfileCard';

describe('ProfileCard', () => {
  const mockProfile = {
    id: '7-boy',
    displayName: '7-year-old boy',
    age: 7,
    gender: 'boy',
    vocabularyStyle: 'moderate',
    complexityLevel: 'moderate',
  };

  it('should render profile information', () => {
    const onSelect = vi.fn();
    render(<ProfileCard profile={mockProfile} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByText('7-year-old boy')).toBeInTheDocument();
    expect(screen.getByText(/Age 7/)).toBeInTheDocument();
    expect(screen.getAllByText(/boy/)[0]).toBeInTheDocument();
  });

  it('should show selected state', () => {
    const onSelect = vi.fn();
    render(<ProfileCard profile={mockProfile} isSelected={true} onSelect={onSelect} />);

    expect(screen.getByText('✓ Selected')).toBeInTheDocument();
  });

  it('should show unselected state', () => {
    const onSelect = vi.fn();
    render(<ProfileCard profile={mockProfile} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByText('Select')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProfileCard profile={mockProfile} isSelected={false} onSelect={onSelect} />);

    const card = screen.getByText('7-year-old boy').closest('div');
    await user.click(card);

    expect(onSelect).toHaveBeenCalledWith('7-boy');
  });

  it('should display correct icon for boy', () => {
    const onSelect = vi.fn();
    render(<ProfileCard profile={mockProfile} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByText('👦')).toBeInTheDocument();
  });

  it('should display correct icon for girl', () => {
    const girlProfile = {
      ...mockProfile,
      id: '4-girl',
      gender: 'girl',
    };

    const onSelect = vi.fn();
    render(<ProfileCard profile={girlProfile} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByText('👧')).toBeInTheDocument();
  });

  it('should apply different styles when selected', () => {
    const onSelect = vi.fn();
    const { container: selectedContainer } = render(
      <ProfileCard profile={mockProfile} isSelected={true} onSelect={onSelect} />
    );
    const { container: unselectedContainer } = render(
      <ProfileCard profile={mockProfile} isSelected={false} onSelect={onSelect} />
    );

    const selectedCard = selectedContainer.querySelector('div');
    const unselectedCard = unselectedContainer.querySelector('div');

    expect(selectedCard.style.backgroundColor).not.toBe(unselectedCard.style.backgroundColor);
    expect(selectedCard.style.border).not.toBe(unselectedCard.style.border);
  });
});

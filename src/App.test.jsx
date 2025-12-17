/**
 * Tests for App component
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock the Home component
vi.mock('./pages/Home', () => ({
  Home: () => <div data-testid="home-page">Home Page</div>,
}));

describe('App', () => {
  it('should render Home component', () => {
    const { getByTestId } = render(<App />);

    expect(getByTestId('home-page')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<App />);

    expect(container.firstChild).toBeInTheDocument();
  });
});

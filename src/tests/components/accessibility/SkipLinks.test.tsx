import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import SkipLinks from '../../../components/accessibility/SkipLinks';

const renderWithAccessibility = (ui: React.ReactNode) => {
  return render(<AccessibilityProvider>{ui}</AccessibilityProvider>);
};

describe('SkipLinks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should render skip links always (not gated by keyboardNavigation)', () => {
    renderWithAccessibility(<SkipLinks />);

    expect(screen.getByText(/ir para o conteudo principal/i)).toBeInTheDocument();
    expect(screen.getByText(/ir para navegacao/i)).toBeInTheDocument();
  });

  it('should have main content link pointing to #main-content', () => {
    renderWithAccessibility(<SkipLinks />);

    const link = screen.getByText(/ir para o conteudo principal/i);
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should have navigation link pointing to #main-navigation', () => {
    renderWithAccessibility(<SkipLinks />);

    const link = screen.getByText(/ir para navegacao/i);
    expect(link).toHaveAttribute('href', '#main-navigation');
  });

  it('should be hidden visually but accessible via skip-link class', () => {
    renderWithAccessibility(<SkipLinks />);

    const link = screen.getByText(/ir para o conteudo principal/i);
    expect(link).toHaveClass('skip-link');
  });

  it('should have proper aria-label on nav', () => {
    renderWithAccessibility(<SkipLinks />);

    const nav = screen.getByLabelText(/links de navegacao rapida/i);
    expect(nav).toBeInTheDocument();
  });

  it('should have exactly two skip links (no search link)', () => {
    renderWithAccessibility(<SkipLinks />);

    const nav = screen.getByLabelText(/links de navegacao rapida/i);
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(2);
  });
});

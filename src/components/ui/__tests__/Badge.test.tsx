import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  test('renders children text', () => {
    render(<Badge>LIVE</Badge>);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  test('renders with "upcoming" variant by default', () => {
    const { container } = render(<Badge>Up Next</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-accent-light');
  });

  test('renders "live" variant with pulsing dot', () => {
    const { container } = render(<Badge variant="live">LIVE</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-danger');
    // Live badge has the animated ping effect
    const dots = badge.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThan(0);
  });

  test('renders "completed" variant', () => {
    const { container } = render(<Badge variant="completed">Done</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-muted');
  });

  test('applies custom className', () => {
    const { container } = render(<Badge className="ml-2">Test</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('ml-2');
  });
});

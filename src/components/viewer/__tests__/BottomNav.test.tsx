import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/contexts/EventContext', () => ({
  useEventId: () => 'test-event',
}));

jest.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({ event: { features: { agenda: true, shoutouts: true, reactions: true, photos: true, trivia: true, pledges: true } }, loading: false }),
}));

// Must import after mock
import BottomNav from '@/components/viewer/BottomNav';
import { usePathname } from 'next/navigation';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
});

describe('BottomNav', () => {
  const mockUsePathname = usePathname as jest.Mock;

  test('renders all four tabs', () => {
    mockUsePathname.mockReturnValue('/test-event/event');

    render(<BottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Shoutouts')).toBeInTheDocument();
  });

  test('highlights Home tab when on /event', () => {
    mockUsePathname.mockReturnValue('/test-event/event');

    render(<BottomNav />);
    const homeLink = screen.getByText('Home').closest('a')!;
    expect(homeLink.className).toContain('text-accent');
  });

  test('highlights Agenda tab when on /event/agenda', () => {
    mockUsePathname.mockReturnValue('/test-event/event/agenda');

    render(<BottomNav />);
    const agendaLink = screen.getByText('Agenda').closest('a')!;
    expect(agendaLink.className).toContain('text-accent');

    // Home should not be active
    const homeLink = screen.getByText('Home').closest('a')!;
    expect(homeLink.className).toContain('text-muted');
  });

  test('highlights React tab on /event/react', () => {
    mockUsePathname.mockReturnValue('/test-event/event/react');

    render(<BottomNav />);
    const reactLink = screen.getByText('React').closest('a')!;
    expect(reactLink.className).toContain('text-accent');
  });

  test('highlights Shoutouts tab on /event/shoutouts', () => {
    mockUsePathname.mockReturnValue('/test-event/event/shoutouts');

    render(<BottomNav />);
    const shoutoutsLink = screen.getByText('Shoutouts').closest('a')!;
    expect(shoutoutsLink.className).toContain('text-accent');
  });

  test('renders correct emojis for tabs', () => {
    mockUsePathname.mockReturnValue('/test-event/event');

    render(<BottomNav />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  test('links to correct paths', () => {
    mockUsePathname.mockReturnValue('/test-event/event');

    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/test-event/event');
    expect(hrefs).toContain('/test-event/event/agenda');
    expect(hrefs).toContain('/test-event/event/react');
    expect(hrefs).toContain('/test-event/event/shoutouts');
  });
});

import { render } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
  test('renders children', () => {
    const { getByText } = render(<Card>Card Content</Card>);
    expect(getByText('Card Content')).toBeInTheDocument();
  });

  test('applies padding by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-6');
  });

  test('removes padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-6');
  });

  test('applies custom className', () => {
    const { container } = render(<Card className="mt-4">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('mt-4');
  });

  test('has card background and border styles', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-bg-card');
    expect(card.className).toContain('rounded-xl');
  });
});

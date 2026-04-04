import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  test('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('renders primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-accent');
  });

  test('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText('Secondary');
    expect(btn.className).toContain('border-accent');
    expect(btn.className).toContain('text-accent');
  });

  test('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByText('Delete');
    expect(btn.className).toContain('bg-danger');
  });

  test('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small').className).toContain('px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large').className).toContain('px-8');
  });

  test('disables the button', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  test('applies custom className', () => {
    render(<Button className="w-full">Wide</Button>);
    expect(screen.getByText('Wide').className).toContain('w-full');
  });
});

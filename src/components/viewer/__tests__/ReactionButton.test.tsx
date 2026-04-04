import { render, screen, fireEvent } from '@testing-library/react';
import ReactionButton from '@/components/viewer/ReactionButton';

describe('ReactionButton', () => {
  test('renders emoji and count', () => {
    render(<ReactionButton emoji="👏" count={42} onClick={jest.fn()} />);
    expect(screen.getByText('👏')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('hides count when zero', () => {
    const { container } = render(<ReactionButton emoji="❤️" count={0} onClick={jest.fn()} />);
    // Only emoji, no count text
    const countSpan = container.querySelector('.tabular-nums');
    expect(countSpan?.textContent).toBe('');
  });

  test('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ReactionButton emoji="🔥" count={5} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<ReactionButton emoji="🎉" count={3} onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('formats large counts with locale string', () => {
    render(<ReactionButton emoji="👏" count={1234} onClick={jest.fn()} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });
});

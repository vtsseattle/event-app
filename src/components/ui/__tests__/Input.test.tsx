import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/ui/Input';

describe('Input', () => {
  test('renders without label', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  test('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('displays error message', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  test('applies error styling when error is present', () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector('input')!;
    expect(input.className).toContain('border-danger');
  });

  test('handles value changes', () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });

  test('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  test('generates unique id when none provided', () => {
    render(<Input label="Test" />);
    const input = screen.getByLabelText('Test') as HTMLInputElement;
    expect(input.id).toBeTruthy();
  });

  test('uses provided id', () => {
    render(<Input id="custom-id" label="Custom" />);
    const input = screen.getByLabelText('Custom') as HTMLInputElement;
    expect(input.id).toBe('custom-id');
  });
});

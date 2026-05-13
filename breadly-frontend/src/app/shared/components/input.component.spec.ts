import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../testing/render-with-providers';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  it('renders label when provided', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { label: 'Username' },
    });
    expect(screen.getByTestId('input-label')).toHaveTextContent('Username');
  });

  it('shows required asterisk when required', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { label: 'Email', required: true },
    });
    expect(screen.getByTestId('input-label')).toHaveTextContent('*');
  });

  it('does not show asterisk when not required', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { label: 'Email', required: false },
    });
    expect(screen.getByTestId('input-label')).not.toHaveTextContent('*');
  });

  it('applies border-danger class when error', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { error: true },
    });
    expect(screen.getByTestId('input').className).toContain('border-danger');
  });

  it('applies border-warning class when warning', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { warning: true },
    });
    expect(screen.getByTestId('input').className).toContain('border-warning');
  });

  it('shows helperText when provided', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { helperText: 'This field is required', error: true },
    });
    expect(screen.getByTestId('input-helper')).toHaveTextContent('This field is required');
  });

  it('styles helperText as danger when error', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { helperText: 'Error message', error: true },
    });
    expect(screen.getByTestId('input-helper').className).toContain('text-danger-text');
  });

  it('styles helperText as warning when warning', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { helperText: 'Warning message', warning: true },
    });
    expect(screen.getByTestId('input-helper').className).toContain('text-warning-text');
  });

  it('shows char count when maxLength is set', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { maxLength: 100 },
    });
    expect(screen.getByTestId('input-count')).toHaveTextContent('0/100');
  });

  it('shows spinner when loading', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { loading: true },
    });
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('is disabled when disabled input is true', async () => {
    await renderWithProviders(InputComponent, {
      componentInputs: { disabled: true },
    });
    expect(screen.getByTestId('input')).toBeDisabled();
  });

  it('emits valueChange on user input', async () => {
    const user = userEvent.setup();
    const valueChange = vi.fn();
    const { fixture } = await renderWithProviders(InputComponent, {
      componentInputs: {},
    });
    fixture.componentInstance.valueChange.subscribe(valueChange);
    await user.type(screen.getByTestId('input'), 'hello');
    expect(valueChange).toHaveBeenCalledWith('hello');
  });
});

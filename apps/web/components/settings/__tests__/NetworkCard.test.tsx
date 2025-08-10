// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, beforeEach, expect } from 'vitest';
import NetworkCard from '../NetworkCard';

describe('NetworkCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders stored relays without flashing defaults', () => {
    localStorage.setItem('pd.relays', JSON.stringify(['wss://relay.example.com']));
    render(<NetworkCard />);
    screen.getByText('wss://relay.example.com');
    expect(screen.queryByText('No relays configured.')).toBeNull();
  });

  it('adds only valid relay URLs', async () => {
    render(<NetworkCard />);
    const input = screen.getAllByPlaceholderText('wss://relay.example.com')[0];
    const add = screen.getAllByText('Add')[0];
    const user = userEvent.setup();

    await user.type(input, 'wss:relay.example.com');
    await user.click(add);
    expect(screen.queryByText('wss:relay.example.com')).toBeNull();

    await user.clear(input);
    await user.type(input, 'http://relay.example.com');
    await user.click(add);
    expect(screen.queryByText('http://relay.example.com')).toBeNull();

    await user.clear(input);
    await user.type(input, 'relay.example.com');
    await user.click(add);
    screen.getByText('wss://relay.example.com');
  });
});

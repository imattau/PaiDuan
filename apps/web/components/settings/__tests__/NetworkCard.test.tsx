// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
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
});

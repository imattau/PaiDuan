/* @vitest-environment jsdom */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import Overlay, { OverlayHost } from './Overlay';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { LayoutContext } from '@/context/LayoutContext';

describe('Overlay', () => {
  it('closes when clicking the overlay and restores interactions', async () => {
    const clickSpy = vi.fn();
    const MockLayoutProvider = ({ children }: { children: React.ReactNode }) => (
      <LayoutContext.Provider value="mobile">{children}</LayoutContext.Provider>
    );
    render(
      <MockLayoutProvider>
        <button onClick={clickSpy}>feed</button>
        <OverlayHost />
      </MockLayoutProvider>
    );

    Overlay.open('modal', { content: <div>content</div> });
    const overlay = document.querySelector('[role="button"][data-state="open"]') as HTMLElement;
    overlay && fireEvent.click(overlay);

    await waitFor(() => expect(screen.queryByText('content')).toBeNull());
    fireEvent.click(screen.getByText('feed'));
    expect(clickSpy).toHaveBeenCalled();
  });

});


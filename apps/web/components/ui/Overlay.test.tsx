/* @vitest-environment jsdom */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import Overlay, { OverlayHost } from './Overlay';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { useLayout } from '@/hooks/useLayout';

vi.mock('@/hooks/useLayout');

describe('Overlay', () => {
  it('closes when clicking the overlay and restores interactions', async () => {
    const clickSpy = vi.fn();
    vi.mocked(useLayout).mockReturnValue('mobile');
    render(
      <>
        <button onClick={clickSpy}>feed</button>
        <OverlayHost />
      </>,
    );

    Overlay.open('modal', { content: <div>content</div> });
    const overlay = document.querySelector('[role="button"][data-state="open"]') as HTMLElement;
    overlay && fireEvent.click(overlay);

    await waitFor(() => expect(screen.queryByText('content')).toBeNull());
    fireEvent.click(screen.getByText('feed'));
    expect(clickSpy).toHaveBeenCalled();
  });
});

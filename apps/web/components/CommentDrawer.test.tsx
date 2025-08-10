/* @vitest-environment jsdom */
import React from 'react';
import { render, waitFor, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import CommentDrawer from './CommentDrawer';
import { OverlayHost } from './ui/Overlay';
import { LayoutContext } from '@/context/LayoutContext';

vi.mock('@/hooks/useComments', () => ({
  default: () => ({ comments: [], hiddenIds: new Set(), send: vi.fn(), canSend: true }),
}));

vi.mock('@/context/modqueueContext', () => ({
  useModqueue: () => [],
}));

vi.mock('react-hot-toast', () => ({
  toast: { error: () => {}, success: () => {} },
}));

vi.mock('../utils/analytics', () => ({
  default: { trackEvent: () => {} },
}));

vi.mock('./ReportModal', () => ({
  default: () => null,
}));

(globalThis as any).React = React;

afterEach(() => {
  cleanup();
});

describe('CommentDrawer', () => {
  it('closes when overlay clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <LayoutContext.Provider value="mobile">
        <OverlayHost />
        <CommentDrawer videoId="v1" open={true} onOpenChange={onOpenChange} />
      </LayoutContext.Provider>,
    );

    // Drawer should be open
    screen.getByText('Comments');
    const overlay = document.querySelector('[data-state="open"][data-aria-hidden="true"]') as HTMLElement;
    expect(overlay).not.toBeNull();

    const user = userEvent.setup();
    await user.click(overlay);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(screen.queryByText('Comments')).toBeNull());
  });
});


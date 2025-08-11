/* @vitest-environment jsdom */
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import Overlay, { OverlayHost, OverlayKind } from './Overlay';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { useLayout, LayoutType } from '@/hooks/useLayout';

vi.mock('@/hooks/useLayout');

describe('Overlay', () => {
  it.each(['desktop', 'tablet', 'mobile'] as LayoutType[])(
    'opens and closes without error (%s layout)',
    async (layout) => {
      vi.mocked(useLayout).mockReturnValue(layout);
      render(<OverlayHost />);

      const type: OverlayKind = layout === 'desktop' ? 'modal' : 'drawer';
      Overlay.open(type, { content: <div>content</div> });

      await waitFor(() => expect(screen.getByText('content')).toBeDefined());

      Overlay.close();

      await waitFor(() => expect(screen.queryByText('content')).toBeNull());
    },
  );
});

import React, { useState, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useLayout } from '@/context/LayoutContext';

export type OverlayKind = 'modal' | 'drawer';

interface OverlayProps {
  content: ReactNode;
  onClose?: () => void;
  autoFocus?: boolean;
}

interface OverlayState {
  type: OverlayKind;
  props: OverlayProps;
}

let openHandler: (type: OverlayKind, props: OverlayProps) => void = () => {};
let closeHandler: () => void = () => {};

export function OverlayHost() {
  const layout = useLayout();
  const [state, setState] = useState<OverlayState | null>(null);

  openHandler = (type: OverlayKind, props: OverlayProps) => {
    setState({ type, props });
  };

  closeHandler = () => {
    if (state?.props.onClose) state.props.onClose();
    setState(null);
  };

  if (!state) return null;

  const isDrawer = state.type === 'drawer' && layout !== 'desktop';

  const contentClass = isDrawer
    ? 'fixed inset-x-0 bottom-0 z-50 h-1/2 bg-background-primary text-primary focus:outline-none'
    : 'fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded bg-background-primary p-4 text-primary focus:outline-none';

  return (
    <Dialog.Root open onOpenChange={(o) => !o && closeHandler()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content
          className={contentClass}
          onOpenAutoFocus={(e) => {
            if (state.props.autoFocus === false) e.preventDefault();
          }}
        >
          {state.props.content}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const Overlay = {
  open(type: OverlayKind, props: OverlayProps) {
    openHandler(type, props);
  },
  close() {
    closeHandler();
  },
};

export default Overlay;

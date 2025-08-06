import { ReactNode } from 'react';
import { useGesture as useGestureImpl } from 'react-use-gesture';
import { useSpring as useSpringImpl, animated } from '@react-spring/web';

export const GestureProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useGesture = useGestureImpl;
export const useSpring = useSpringImpl;
export { animated };

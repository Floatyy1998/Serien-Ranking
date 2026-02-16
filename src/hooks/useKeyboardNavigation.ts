import { useCallback } from 'react';

interface UseKeyboardNavigationOptions {
  itemCount: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

export function useKeyboardNavigation({
  itemCount,
  currentIndex,
  onIndexChange,
  orientation = 'horizontal',
  loop = true,
}: UseKeyboardNavigationOptions) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const prevKeys = orientation === 'horizontal' ? ['ArrowLeft'] : ['ArrowUp'];
      const nextKeys = orientation === 'horizontal' ? ['ArrowRight'] : ['ArrowDown'];

      // Support both orientations
      const allPrevKeys = [...prevKeys, ...(orientation === 'horizontal' ? ['ArrowUp'] : ['ArrowLeft'])];
      const allNextKeys = [...nextKeys, ...(orientation === 'horizontal' ? ['ArrowDown'] : ['ArrowRight'])];

      if (allPrevKeys.includes(e.key)) {
        e.preventDefault();
        if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        } else if (loop) {
          onIndexChange(itemCount - 1);
        }
      } else if (allNextKeys.includes(e.key)) {
        e.preventDefault();
        if (currentIndex < itemCount - 1) {
          onIndexChange(currentIndex + 1);
        } else if (loop) {
          onIndexChange(0);
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        onIndexChange(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        onIndexChange(itemCount - 1);
      }
    },
    [itemCount, currentIndex, onIndexChange, orientation, loop]
  );

  return { onKeyDown };
}

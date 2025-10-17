'use client';

import { useEffect } from 'react';
import { useBoolean } from 'usehooks-ts';

export const ElementsAndEmbeddedComponentsHighlight = () => {
  const { value: isHighlighting, toggle: toggleHighlight } = useBoolean(false);

  useEffect(() => {
    const abortController = new AbortController();

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.ctrlKey && event.key === 'h') {
          event.preventDefault();
          toggleHighlight();
        }
      },
      {
        signal: abortController.signal,
      },
    );

    return () => {
      abortController.abort();
    };
  }, [toggleHighlight]);

  useEffect(() => {
    if (isHighlighting) {
      document.body.classList.add('reveal-elements');

      return;
    }

    document.body.classList.remove('reveal-elements');
  }, [isHighlighting]);

  return null;
};

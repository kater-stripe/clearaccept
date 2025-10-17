import { Appearance } from '@stripe/stripe-js';

export const elementsAppearence = {
  theme: 'stripe',
  labels: 'floating',
  variables: {
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    fontLineHeight: '1.5',
    borderRadius: '8px',
    fontSizeBase: '14px',
    // colorBackground: '#F6F8FA',
    colorBackground: '#FFFFFF',
    colorPrimary: '#222725',
    //colorPrimary: '#154960', // accent color
    colorText: '#171717',
    accessibleColorOnColorPrimary: '#F1F2E0',
    focusOutline: 'var(--colorPrimary) auto 1px',
    focusBoxShadow: 'none',
  },
  rules: {
    '.Block': {
      backgroundColor: 'var(--colorBackground)',
      boxShadow: 'none',
      padding: '12px',
      border: '1px solid #eeeeee',
    },
    '.Input': {
      padding: '12px',
      border: '1px solid #eeeeee',
    },
    '.Input:disabled, .Input--invalid:disabled': {
      color: 'lightgray',
    },
    '.Tab': {
      padding: '10px 12px 8px 12px',
      border: 'none',
    },
    '.Tab:hover': {
      border: 'none',
      boxShadow:
        '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)',
    },
    '.Tab--selected, .Tab--selected:focus, .Tab--selected:hover': {
      border: 'none',
      backgroundColor: '#fff',
      boxShadow:
        '0 0 0 2px var(--colorPrimary), 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)',
    },
    '.Label': {
      fontWeight: '500',
    },
    '.AccordionItem, .PickerItem, .CheckboxInput, .CodeInput, .PickerItem--selected, .PickerItem--selected:focus, .PickerItem--selected:hover':
      {
        // boxShadow: '0 0 0 2px #eeeeee, 0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 7px rgba(18, 42, 66, 0.04)',
        boxShadow: '0 0 #000, 0 0 #000, 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e5e5',
      },
  },
} as const satisfies Appearance;

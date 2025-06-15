import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  } as ThemeConfig,
  styles: {
    global: ({ colorMode }: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: colorMode === 'dark' ? 'gray.100' : 'gray.800',
      },
    }),
  },
});

export default theme;

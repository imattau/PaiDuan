'use client';

import { extendTheme } from '@chakra-ui/react';
import themeConfig from './theme-config';

const theme = extendTheme({ config: themeConfig });

export default theme;


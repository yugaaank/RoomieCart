import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config/v3'
import { createInterFont } from '@tamagui/font-inter'
import * as dmSerifFont from '@tamagui/font-dm-serif-display'

const interFont = createInterFont()
const serifFont = dmSerifFont.font

const lightTheme = {
  background: '#faf9f7',
  backgroundStrong: '#f4f3f1',
  color: '#1a1c1b',
  colorSubtitle: '#737971',
  borderColor: '#c2c8bf',
  primary: '#466349',
  onPrimary: '#ffffff',
  primaryContainer: '#5e7c60',
  red10: '#ba1a1a',
}

const darkTheme = {
  background: '#121413',
  backgroundStrong: '#1e211f',
  color: '#e7e3d8',
  colorSubtitle: '#a8b0aa',
  borderColor: '#39423d',
  primary: '#8fb38d',
  onPrimary: '#05210c',
  primaryContainer: '#2b442e',
  red10: '#f2b8b5',
}

export const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    body: interFont,
    heading: serifFont,
  },
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      ...lightTheme,
    },
    dark: {
      ...config.themes.dark,
      ...darkTheme,
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig

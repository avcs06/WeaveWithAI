import { themeClasses, ThemeMode } from './themes.css';

export const getThemeClass = (mode: ThemeMode) => themeClasses[mode];

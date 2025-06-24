import React, { createContext, useState, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: PropsWithChildren<object>) => {
  // Initially undefined so we can delay render until loaded
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // Load saved theme preference on mount, if any
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDark');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'true');
        } else {
          // No saved preference, use system default
          const colorScheme = Appearance.getColorScheme();
          setIsDark(colorScheme === 'dark');
        }
      } catch (e) {
        console.error('Error loading theme preference', e);
        // Fallback to system default on error
        const colorScheme = Appearance.getColorScheme();
        setIsDark(colorScheme === 'dark');
      }
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('isDark', newTheme.toString());
    } catch (e) {
      console.error('Error saving theme preference', e);
    }
  };

  // While loading theme preference, don't render children (optional)
  if (isDark === null) {
    return null; // Or a splash/loading screen if you want
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

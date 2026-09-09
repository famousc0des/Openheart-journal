import { StyleSheet, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EmojiText } from '@/lib/with-emoji-fallback';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, children, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <EmojiText
      style={[
        { color: theme[themeColor ?? 'text'], includeFontPadding: false },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}>
      {children}
    </EmojiText>
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  smallBold: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  default: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: Tracking.body,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 40,
    lineHeight: 52,
    letterSpacing: Tracking.display,
  },
  subtitle: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: Tracking.heading,
  },
  link: {
    fontFamily: Fonts.regular,
    lineHeight: 30,
    fontSize: 14,
    letterSpacing: Tracking.body,
  },
  linkPrimary: {
    fontFamily: Fonts.regular,
    lineHeight: 30,
    fontSize: 14,
    letterSpacing: Tracking.body,
    color: '#3B82F6',
  },
  code: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
});

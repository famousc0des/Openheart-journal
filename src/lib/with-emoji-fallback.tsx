import { memo, useMemo, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';

/** Pictograph + optional modifier/VS16, including ZWJ sequences such as 👨‍👩‍👧. */
const EMOJI_RUN =
  /\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?)*/gu;

export type EmojiPart = { kind: 'text' | 'emoji'; value: string };

export function splitEmojiParts(value: string): EmojiPart[] {
  EMOJI_RUN.lastIndex = 0;
  if (!EMOJI_RUN.test(value)) return [{ kind: 'text', value }];
  EMOJI_RUN.lastIndex = 0;

  const parts: EmojiPart[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = EMOJI_RUN.exec(value))) {
    if (match.index > last) parts.push({ kind: 'text', value: value.slice(last, match.index) });
    parts.push({ kind: 'emoji', value: match[0] });
    last = match.index + match[0].length;
  }

  if (last < value.length) parts.push({ kind: 'text', value: value.slice(last) });
  return parts;
}

function flattenPlainText(children: ReactNode): string | null {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    const chunks: string[] = [];
    for (const child of children) {
      const next = flattenPlainText(child);
      if (next === null) return null;
      chunks.push(next);
    }
    return chunks.join('');
  }
  return null;
}

function hasPictograph(value: string) {
  return splitEmojiParts(value).some((part) => part.kind === 'emoji');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function emojiHtml(glyph: string, fontSize: number) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;height:100%;}body{display:flex;align-items:center;justify-content:flex-start;}span{font-size:${fontSize}px;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;}</style></head><body><span>${escapeHtml(glyph)}</span></body></html>`;
}

/** iOS 26 simulator CoreText cannot resolve Apple Color Emoji in RN Text; WebKit still can. */
export const EmojiGlyph = memo(function EmojiGlyph({
  children,
  fontSize,
  lineHeight,
}: {
  children: string;
  fontSize: number;
  lineHeight?: number;
}) {
  const height = lineHeight ?? fontSize;
  const html = useMemo(() => emojiHtml(children, fontSize), [children, fontSize]);

  if (Platform.OS !== 'ios') {
    return (
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: Platform.select({ android: 'sans-serif' }),
          fontSize,
          lineHeight: height,
          includeFontPadding: false,
        }}>
        {children}
      </Text>
    );
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      pointerEvents="none"
      style={{
        width: fontSize + 6,
        height,
        backgroundColor: 'transparent',
      }}
    />
  );
});

/** Mix UI on letters; emoji are siblings so they cannot inherit the custom face. */
export function EmojiLine({
  children,
  textStyle,
  fontSize,
  lineHeight,
  numberOfLines,
  style,
}: {
  children: string;
  textStyle: TextStyle;
  fontSize: number;
  lineHeight: number;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const parts = splitEmojiParts(children);
  const singleLine = numberOfLines === 1;
  const justify =
    textStyle.textAlign === 'right'
      ? 'flex-end'
      : textStyle.textAlign === 'center'
        ? 'center'
        : 'flex-start';

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: singleLine ? 'nowrap' : 'wrap',
          alignItems: 'center',
          justifyContent: justify,
          overflow: singleLine ? 'hidden' : undefined,
        },
        style,
      ]}>
      {parts.map((part, index) =>
        part.kind === 'emoji' ? (
          <EmojiGlyph key={`emoji-${index}`} fontSize={fontSize} lineHeight={lineHeight}>
            {part.value}
          </EmojiGlyph>
        ) : (
          <Text key={`text-${index}`} style={textStyle}>
            {part.value}
          </Text>
        ),
      )}
    </View>
  );
}

/** Drop-in Text: Mix UI when there is no pictograph; WebKit glyphs on iOS when there is. */
export function EmojiText({ children, style, numberOfLines, ...rest }: TextProps) {
  const plain = flattenPlainText(children);
  if (plain === null || !hasPictograph(plain)) {
    return (
      <Text style={style} numberOfLines={numberOfLines} {...rest}>
        {children}
      </Text>
    );
  }

  const resolved = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontSize = typeof resolved.fontSize === 'number' ? resolved.fontSize : 16;
  const lineHeight = typeof resolved.lineHeight === 'number' ? resolved.lineHeight : Math.round(fontSize * 1.3);
  const containerStyle: ViewStyle = {};
  if (resolved.flex != null) containerStyle.flex = resolved.flex;
  if (resolved.flexShrink != null) containerStyle.flexShrink = resolved.flexShrink;
  else if (numberOfLines === 1) containerStyle.flexShrink = 1;
  if (resolved.maxWidth != null) containerStyle.maxWidth = resolved.maxWidth;

  return (
    <EmojiLine
      textStyle={resolved}
      fontSize={fontSize}
      lineHeight={lineHeight}
      numberOfLines={numberOfLines}
      style={containerStyle}>
      {plain}
    </EmojiLine>
  );
}

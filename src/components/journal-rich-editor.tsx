import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Palette } from '@/constants/theme';
import { toEditorHtml } from '@/lib/rich-text';

export type JournalEditorHandle = {
  run: (cmd: string, arg?: string) => void;
  focus: () => void;
};

export const FORMAT_FONTS = [
  { label: 'Sans', value: 'Helvetica Neue' },
  { label: 'Serif', value: 'Georgia' },
  { label: 'Journal', value: 'Palatino' },
  { label: 'Typewriter', value: 'Courier New' },
] as const;

export const FORMAT_SIZES = [
  { label: 'S', value: '14' },
  { label: 'M', value: '18' },
  { label: 'L', value: '22' },
  { label: 'XL', value: '28' },
] as const;

export const FORMAT_HIGHLIGHTS = [
  { label: 'Clear', value: 'transparent' },
  { label: 'Yellow', value: '#FDE68A' },
  { label: 'Peach', value: '#FECACA' },
  { label: 'Mint', value: '#BBF7D0' },
  { label: 'Sky', value: '#BFDBFE' },
] as const;

function editorPage(opts: { html: string; editable: boolean; text: string; pad: number }) {
  const initial = JSON.stringify(opts.html);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    --ink: ${opts.text};
    color: var(--ink);
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
    font-size: 17px;
    line-height: 1.7;
    text-align: left;
    -webkit-text-size-adjust: 100%;
  }
  #ed {
    min-height: 220px;
    padding: 0 ${opts.pad}px 56px;
    outline: none;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  ul, ol { margin: 0.45em 0; padding: 0 0 0 1.4em; }
  ol { font-variant-numeric: tabular-nums; }
  li { margin: 0.22em 0; }
  li::marker { font-weight: 700; color: var(--ink); }
  p, #ed > div { margin: 0 0 0.85em; }
  p:last-child, #ed > div:last-child { margin-bottom: 0; }
  img { max-width: 100%; height: auto; border-radius: 18px; margin: 0.4em 0 0.9em; display: block; }
  h2 { font-size: 1.28em; font-weight: 700; line-height: 1.35; margin: 0.7em 0 0.4em; }
  blockquote {
    margin: 0.7em 0;
    padding: 0 0 0 0.9em;
    border-left: 2px solid currentColor;
    font-style: italic;
  }
</style>
</head>
<body>
  <div id="ed" contenteditable="${opts.editable ? 'true' : 'false'}"></div>
  <script>
    const ed = document.getElementById('ed');
    ed.innerHTML = ${initial};
    function emit() {
      const h = Math.max(ed.scrollHeight, document.body.scrollHeight);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'update',
        html: ed.innerHTML,
        height: h
      }));
    }
    function applyFontSize(px) {
      document.execCommand('styleWithCSS', true, true);
      document.execCommand('fontSize', false, '7');
      Array.from(ed.querySelectorAll('font, span')).forEach(function(node) {
        if (node.getAttribute && node.getAttribute('size') === '7') {
          node.removeAttribute('size');
          node.style.fontSize = px + 'px';
        }
        if (node.style && (node.style.fontSize === 'xxx-large' || node.style.fontSize === '-webkit-xxx-large')) {
          node.style.fontSize = px + 'px';
        }
      });
    }
    function highlight(color) {
      document.execCommand('styleWithCSS', true, true);
      if (color === 'transparent') {
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('backColor', false, 'transparent');
        return;
      }
      if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }
    }
    window.OH = {
      run: function(cmd, value) {
        ed.focus();
        document.execCommand('styleWithCSS', true, true);
        if (cmd === 'fontSize') applyFontSize(value);
        else if (cmd === 'highlight') highlight(value);
        else if (cmd === 'heading') document.execCommand('formatBlock', false, 'h2');
        else if (cmd === 'insertHTML') document.execCommand('insertHTML', false, value || '');
        else document.execCommand(cmd, false, value || null);
        emit();
      },
      focus: function() { ed.focus(); }
    };
    ed.addEventListener('input', emit);
    emit();
    ${opts.editable ? 'setTimeout(function(){ ed.focus(); }, 280);' : ''}
  </script>
</body>
</html>`;
}

export const JournalRichEditor = forwardRef<
  JournalEditorHandle,
  { value: string; onChange: (html: string) => void; ink?: string }
>(function JournalRichEditor({ value, onChange, ink = Palette.ink }, ref) {
  const webRef = useRef<WebView>(null);
  const html = useMemo(
    () =>
      editorPage({
        html: toEditorHtml(value),
        editable: true,
        text: ink,
        pad: 0,
      }),
    // Keep the WebView document stable after first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function run(cmd: string, arg?: string) {
    webRef.current?.injectJavaScript(
      `true;window.OH&&window.OH.run(${JSON.stringify(cmd)},${JSON.stringify(arg ?? null)});true;`
    );
  }

  function updateInk() {
    webRef.current?.injectJavaScript(
      `document.documentElement.style.setProperty('--ink', ${JSON.stringify(ink)});document.body.style.setProperty('--ink', ${JSON.stringify(ink)});true;`
    );
  }

  // Update colors without reloading the document or losing unsaved writing.
  useEffect(updateInk, [ink]);

  useImperativeHandle(ref, () => ({
    run,
    focus: () => {
      webRef.current?.injectJavaScript('true;window.OH&&window.OH.focus();true;');
    },
  }));

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onLoadEnd={updateInk}
        hideKeyboardAccessoryView
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        style={styles.web}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data) as { html?: string };
            if (typeof message.html === 'string') onChange(message.html);
          } catch {
            // ignore malformed editor messages
          }
        }}
      />
    </View>
  );
});

export function JournalRichBody({ html, ink = Palette.ink }: { html: string; ink?: string }) {
  const [height, setHeight] = useState(200);
  const source = useMemo(
    () =>
      editorPage({
        html: toEditorHtml(html),
        editable: false,
        text: ink,
        pad: 0,
      }),
    [html, ink]
  );

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: source }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      style={{ height: Math.max(height, 80), backgroundColor: 'transparent', width: '100%' }}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as { height?: number };
          if (typeof message.height === 'number' && message.height > 0) {
            setHeight(message.height + 8);
          }
        } catch {
          // ignore
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 200 },
  web: { flex: 1, backgroundColor: 'transparent' },
});

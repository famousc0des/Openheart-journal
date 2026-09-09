export function looksLikeHtml(value: string) {
  return /<\/?(p|div|br|b|i|em|strong|ul|ol|li|span|mark|font|u|h[1-6]|img|blockquote)\b/i.test(value);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isRichEmpty(html: string) {
  if (/<img\b/i.test(html)) return false;
  return htmlToPlainText(html).length === 0;
}

export function toEditorHtml(raw: string) {
  if (!raw.trim()) return '';
  if (looksLikeHtml(raw)) return raw;
  return escapeHtml(raw).replace(/\n/g, '<br>');
}

export function sanitizeRichHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

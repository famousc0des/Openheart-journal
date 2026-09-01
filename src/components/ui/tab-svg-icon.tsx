import { ColorValue } from 'react-native';
import { SvgXml } from 'react-native-svg';

export function TabSvgIcon({ xml, color, size }: { xml: string; color: ColorValue; size: number }) {
  const colored = xml.replace(/<path /g, `<path fill="${String(color)}" `);
  return <SvgXml xml={colored} width={size} height={size} />;
}

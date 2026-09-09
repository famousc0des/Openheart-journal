// Hugeicons 4.3.2 exports individual JS entrypoints but omits their declarations.
// Keep those imports typed with the renderer's official icon data contract.
declare module '@hugeicons/core-free-icons/*' {
  import type { IconSvgElement } from '@hugeicons/react-native';
  const icon: IconSvgElement;
  export default icon;
}

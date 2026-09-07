import { Text, TextInput } from 'react-native';

import { Fonts } from '@/constants/theme';

type WithDefaults = {
  defaultProps?: {
    style?: object | object[];
  };
};

let applied = false;

/** Makes every Text and TextInput use Spotify Mix UI unless a style sets another family. */
export function applyInterDefaults() {
  if (applied) return;
  applied = true;

  const regular = { fontFamily: Fonts.regular };

  function patch(Component: WithDefaults) {
    const previous = Component.defaultProps?.style;
    Component.defaultProps = {
      ...Component.defaultProps,
      style: [regular, previous],
    };
  }

  patch(Text as unknown as WithDefaults);
  patch(TextInput as unknown as WithDefaults);
}

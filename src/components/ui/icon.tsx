import { HugeiconsIcon, type HugeiconsProps } from '@hugeicons/react-native';

import { useTheme } from '@/hooks/use-theme';
import { appIcons, type IconName } from '@/lib/icons/app';

export type IconProps = HugeiconsProps;

/** Decorative by default; label the enclosing control or supply accessibilityLabel. */
export function Icon({ size = 24, color, strokeWidth = 1.5, accessibilityLabel, ...props }: IconProps) {
  const theme = useTheme();
  const meaningful = Boolean(accessibilityLabel);

  return (
    <HugeiconsIcon
      size={size}
      color={color ?? theme.text}
      strokeWidth={strokeWidth}
      accessible={meaningful}
      accessibilityRole={meaningful ? 'image' : undefined}
      accessibilityElementsHidden={!meaningful}
      importantForAccessibility={meaningful ? 'yes' : 'no'}
      aria-hidden={!meaningful}
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  );
}

type NamedIconProps = Omit<IconProps, 'icon' | 'altIcon'> & {
  name: IconName;
  altName?: IconName;
};

/** Supports the names used in action metadata without loading an entire icon pack. */
export function NamedIcon({ name, altName, ...props }: NamedIconProps) {
  return <Icon icon={appIcons[name]} altIcon={altName ? appIcons[altName] : undefined} {...props} />;
}

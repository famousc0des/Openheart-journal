# App icons

Use the shared `Icon` component for new UI:

```tsx
import SearchIcon from '@hugeicons/core-free-icons/Search01Icon';
import { Icon } from '@/components/ui/icon';

<Icon icon={SearchIcon} size={20} />
```

Import individual public entrypoints: Metro includes the full catalog when importing
from the package root. `navigation.ts` groups tab icons, while `app.ts` supplies
typed names for existing action metadata through `NamedIcon`.

Defaults are 24px, a 1.5px stroke, and the current theme's text color. Explicit colors
override the theme. Forward `altIcon` and `showAlt` for toggles, or `altName` and
`showAlt` with `NamedIcon`.

Icons are decorative by default. Give icon-only controls an `accessibilityLabel`
and a button role. Supply a label directly to `Icon` only for standalone meaningful
images.

Version 4.3.2 omits type declarations for its individual entrypoints. The local
`hugeicons.d.ts` supplies the renderer's official data type until upstream includes
those declarations. Check that new icon entrypoints exist and run TypeScript and
Expo exports when adding icons or upgrading the package.

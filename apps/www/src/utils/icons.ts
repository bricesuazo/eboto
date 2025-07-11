// Centralized icon exports to improve tree-shaking
// Import only the icons you need from @tabler/icons-react

export {
  IconArrowRight,
  IconArrowUp,
  IconArrowDown,
  IconAt,
  IconCheck,
  IconCircleCheck,
  IconDownload,
  IconFingerprint,
  IconFlag,
  IconFlag3,
  IconLayoutDashboard,
  IconLetterCase,
  IconLock,
  IconMapPin,
  IconPhone,
  IconQrcode,
  IconRocket,
  IconSearch,
  IconSun,
  IconTrash,
  IconUser,
  IconX,
  IconAlertCircle,
  IconInfoCircle,
  IconRefresh,
  IconUserMinus,
} from '@tabler/icons-react';

// Import for creating mapping
import {
  IconArrowRight,
  IconArrowUp,
  IconArrowDown,
  IconCheck,
  IconDownload,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react';

// Create a mapping object for commonly used icons to enable better code splitting
export const CommonIcons = {
  ArrowRight: IconArrowRight,
  ArrowUp: IconArrowUp,
  ArrowDown: IconArrowDown,
  Check: IconCheck,
  Download: IconDownload,
  Search: IconSearch,
  User: IconUser,
  X: IconX,
} as const;

// Type for icon names
export type IconName = keyof typeof CommonIcons;
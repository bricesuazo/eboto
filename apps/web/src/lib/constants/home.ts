import {
  BarChart3,
  Lock,
  MessageSquare,
  Settings2,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface HomeFeature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const HOME_FEATURES: readonly HomeFeature[] = [
  {
    icon: Lock,
    title: 'Secure by design',
    body: 'Open-source and auditable. Magic-link sign-in keeps voter identity verified without exposing credentials.',
  },
  {
    icon: BarChart3,
    title: 'Real-time results',
    body: "Live vote counts as ballots come in. Candidate names stay hidden during the election to keep results fair.",
  },
  {
    icon: Settings2,
    title: 'Fully customizable',
    body: 'Configure positions, partylists, voter quotas, and privacy. Templates available for SSG and other elections.',
  },
  {
    icon: MessageSquare,
    title: 'Voter chat',
    body: 'Reach voters in-flight with real-time chat — useful for clarifications, deadlines, and reminders.',
  },
  {
    icon: Zap,
    title: 'Multiple elections, one account',
    body: 'Run several elections in parallel from a single dashboard. No duplicate accounts, no hopping between tabs.',
  },
  {
    icon: Sparkles,
    title: 'Adjustable publicity',
    body: "Choose Private, Voter-only, or Public — the right amount of visibility for each election you run.",
  },
];

export interface HomePricingTier {
  name: string;
  price: string;
  cadence?: string;
  blurb: string;
  features: readonly string[];
  cta: { label: string; to: string };
  highlighted?: boolean;
}

export const HOME_PRICING: readonly HomePricingTier[] = [
  {
    name: 'Free',
    price: '₱0',
    cadence: 'For a lifetime',
    blurb: 'Get started with everything you need to run a real election.',
    features: [
      'Hourly result updates',
      'Up to 500 voters',
      'Live admin support',
    ],
    cta: { label: 'Register', to: '/sign-in' },
  },
  {
    name: 'Plus',
    price: '₱199',
    cadence: 'per election',
    blurb: 'Add another election to your account whenever you need it.',
    features: ['Add 1 election to your account'],
    cta: { label: 'Get Plus', to: '/pricing' },
  },
  {
    name: 'Boost',
    price: '₱499',
    cadence: 'per election',
    blurb: 'Up to 1,500 voters with the full real-time experience.',
    features: [
      'Real-time updates',
      'Real-time chat with voters',
      'Ad-free, no watermark',
      'Live support',
    ],
    cta: { label: 'Get Boost', to: '/pricing' },
    highlighted: true,
  },
  {
    name: 'Custom',
    price: 'Talk to us',
    blurb: 'On-premises hosting at your facility, with unlimited voters.',
    features: ['Unlimited voters', 'Hosted at your facility'],
    cta: { label: 'Contact us', to: '/contact' },
  },
];

export interface HomeFaq {
  q: string;
  a: string;
}

export const HOME_FAQS: readonly HomeFaq[] = [
  {
    q: 'How safe is eBoto?',
    a: 'eBoto is open-source software, which means the source code is available to the public for review and improvement.',
  },
  {
    q: 'Does eBoto offer real-time vote count?',
    a: 'Yes. During an ongoing election, candidate names in the real-time vote count page stay hidden until the election has ended.',
  },
  {
    q: 'Can I have a position with multiple selections, such as Senators?',
    a: 'Yes. You can customize positions in the position dashboard based on the requirements of your election.',
  },
  {
    q: "Can I view the election's real-time vote count even if I'm not a voter?",
    a: 'It depends on the publicity setting. eBoto offers three: Private (only the commissioner sees the election), Voter (visible to commissioner and voters), and Public (information and real-time vote count are publicly available).',
  },
  {
    q: 'Can an Election Commissioner vote in their own election?',
    a: "Yes. The commissioner can add themselves to the voter's list and vote in their own election.",
  },
  {
    q: 'Do I need to create multiple accounts for different elections?',
    a: 'No. You can manage and vote in multiple elections with a single account — visit your dashboard to view and manage them.',
  },
  {
    q: 'Can I participate in multiple elections simultaneously?',
    a: 'Yes. As a commissioner and voter, you can participate in multiple ongoing elections without creating another account.',
  },
  {
    q: 'Is eBoto only available at Cavite State University?',
    a: 'No. eBoto is available for any type of organization that requires secure and flexible online voting.',
  },
  {
    q: 'Can I use eBoto for Supreme Student Government (SSG) Elections?',
    a: 'Yes. eBoto provides an SSG Elections template, which you can customize further in the dashboard to suit your specific requirements.',
  },
];

import {
  IconDashboard,
  IconHome,
  IconSparkles,
  IconUserCog,
} from "@tabler/icons-react";

export const siteConfig = {
  name: "eBoto – Your One-Stop Online Voting Solution",
  description:
    "Empower your elections with eBoto, the versatile and web-based voting platform that offers secure online elections for any type of organization.",
  url: "https://www.eboto-mo.com",
  ogImage: "https://www.eboto-mo.com/og.jpg",
  links: {
    twitter: "https://twitter.com/brice_suazo",
    github: "https://github.com/bricesuazo/eboto-mo",
  },
};

export type SiteConfig = typeof siteConfig;

export const SPOTLIGHT_DATA = [
  {
    id: "home",
    label: "Home",
    description: "Get to home page",
    link: "/",
    leftSection: <IconHome />,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "See your election that you are part of",
    link: "/dashboard",
    leftSection: <IconDashboard />,
  },
  {
    id: "account",
    label: "Account Settings",
    description: "Change your account settings",
    leftSection: <IconUserCog />,
    link: "/account",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "See our pricing plans",
    leftSection: <IconSparkles />,
    link: "/pricing",
  },
];

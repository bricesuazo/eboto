import { z } from "zod";

import {
  IconFlag,
  IconLayoutDashboard,
  IconReplace,
  IconSettings,
  IconUsers,
  IconUserSearch,
} from "@tabler/icons-react";
export const electionDashboardNavbar: {
  id: number;
  label: string;
  path?: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 0,
    label: "Overview",
    icon: IconLayoutDashboard,
  },
  {
    id: 1,
    label: "Partylists",
    path: "partylist",
    icon: IconFlag,
  },
  {
    id: 2,
    label: "Positions",
    path: "position",
    icon: IconReplace,
  },
  {
    id: 3,
    label: "Candidates",
    path: "candidate",
    icon: IconUserSearch,
  },
  {
    id: 4,
    label: "Voters",
    path: "voter",
    icon: IconUsers,
  },
  {
    id: 5,
    label: "Settings",
    path: "settings",
    icon: IconSettings,
  },
];

const positionTemplateSchema = z.array(
  z.object({
    id: z.number(),
    org: z.string(),
    positions: z.array(z.string()),
    college: z.string(),
  })
);

export type PositionTemplate = z.infer<typeof positionTemplateSchema>;

export const positionTemplate: PositionTemplate = [
  { id: 0, org: "None", positions: [], college: "No template" },
  {
    id: 1,
    org: "CEIT-SC",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Vice President for Records and Documentation",
      "Vice President for Finance and Budget Management",
      "Vice President for Audit Planning and Risk Assesstment",
      "Vice President for Operations and Implementation",
      "Vice President for Public Relations",
      "Vice President for Business Affairs and Procurement",
      "Vice President for Social and Environmental Awareness",
      "Vice President for Sports, Culture, and the Arts",
      "Vice President for Students Rights and Welfare",
    ],
    college: "CEIT - College of Engineering and Information Technology",
  },
  {
    id: 2,
    org: "CSSO",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Executive Secretary",
      "Assistant Secretary",
      "Treasurer",
      "Auditor",
      "Business Manager",
      "Public Relations Officer",
      "Gender and Development Representative",
    ],
    college: "CEIT - College of Engineering and Information Technology",
  },
  {
    id: 3,
    org: "CoESS-ICPEP",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Secretary",
      "Assistant Secretary",
      "Treasurer",
      "Auditor",
      "Business Manager",
      "Public Relations Officer",
    ],
    college: "CEIT - College of Engineering and Information Technology",
  },
  {
    id: 4,
    org: "IIEE",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Vice President for Technical",
      "Secretary",
      "Assistant Secretary",
      "Treasurer",
      "Assistant Treasurer",
      "Auditor",
      "Public Relations Officer",
    ],
    college: "CEIT - College of Engineering and Information Technology",
  },
  {
    id: 5,
    org: "PIIE",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Vice President for Finance",
      "Vice President for Documentation",
      "Vice President for Academics and Research",
      "Vice President for Publication",
      "Vice President for Activities and Preparation",
      "Vice President for Communication",
      "Vice President for Marketing",
    ],
    college: "CEIT - College of Engineering and Information Technology",
  },
];

const takenSlugsSchema = z.array(z.string());

export type TakenSlugs = z.infer<typeof takenSlugsSchema>;

export const takenSlugs: TakenSlugs = [
  "api",
  "settings",
  "election",
  "user",
  "token",
  "login",
  "signin",
  "signup",
  "logout",
  "forgot-password",
  "reset-password",
  "verify",
  "dashboard",
  "contact",
  "account",
  "profile",
  "invite",
  "admin",
  "admin-dashboard",
  "admin-election",
  "admin-user",
  "admin-settings",
  "invitation",
  "account",
  "facebook",
  "twitter",
  "google",
  "github",
  "linkedin",
  "email",
];

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

export const FAQs: { id: string; question: string; answer: string }[] = [
  {
    id: "how-safe-is-eboto-mo",
    question: "How safe is eBoto Mo?",
    answer:
      "eBoto Mo is an open-source software, which means that the source code is available to the public for review and improvement. Open-source software is generally considered safe because it allows for greater transparency and accountability in the development process.",
  },
  {
    id: "does-eboto-mo-offer-real-time-vote-count",
    question: "Does eBoto Mo offer real-time vote count?",
    answer:
      "Yes, eBoto Mo provides a real-time vote count feature. However, during an ongoing election, the candidate's name in the real-time vote count page will not be revealed until the election has ended.",
  },
  {
    id: "can-i-have-a-position-with-multiple-selections-such-as-senators",
    question:
      "Can I have a position with multiple selections, such as Senators?",
    answer:
      "Yes, you can customize the positions in the position dashboard page based on the requirements of your election.",
  },
  {
    id: "can-i-view-the-elections-real-time-vote-count-even-if-im-not-a-voter",
    question:
      "Can I view the election's real-time vote count even if I'm not a voter?",
    answer: `It depends on the election's publicity settings. eBoto Mo offers three types of publicity settings: "Private" where only the election commissioner can see the election; "Voter" where the election is visible to both the commissioner and voters; and "Public" where the election's information and real-time vote count are publicly available.`,
  },
  {
    id: "can-an-election-commissioner-vote-in-their-own-election",
    question: "Can an Election Commissioner vote in their own election?",
    answer:
      "Yes, the election commissioner can add themselves to the voter's list and vote in their own election.",
  },
  {
    id: "do-i-need-to-create-multiple-accounts-for-different-elections",
    question: "Do I need to create multiple accounts for different elections?",
    answer:
      "No, you can manage and vote in multiple elections with a single account. Simply visit your dashboard to view and manage your elections.",
  },
  {
    id: "can-i-participate-in-multiple-elections-simultaneously",
    question: "Can I participate in multiple elections simultaneously?",
    answer:
      "Yes, as an election commissioner and voter, you can participate in multiple ongoing elections without the need to create another account.",
  },
  {
    id: "is-eboto-mo-only-available-at-cavite-state-university",
    question: "Is eBoto Mo only available at Cavite State University?",
    answer:
      "No, eBoto Mo is available for any type of organization that requires secure and flexible online voting.",
  },
  {
    id: "can-i-use-eboto-mo-for-supreme-student-government-ssg-elections",
    question:
      "Can I use eBoto Mo for Supreme Student Government (SSG) Elections?",
    answer:
      "Yes, eBoto Mo offers a template for SSG Elections, and you can customize it further in the dashboard page to suit your specific requirements.",
  },
  // {
  //   id: "",
  //   question: "",
  //   answer: "",
  // },
];

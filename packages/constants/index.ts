import {
  IconFlag,
  IconLayoutDashboard,
  IconReplace,
  IconSettings,
  IconUsers,
  IconUserSearch,
} from "@tabler/icons-react";
import type { Icon, IconProps } from "@tabler/icons-react";
import { add, getHours, isAfter, isWithinInterval, sub } from "date-fns";
import { el } from "date-fns/locale";
import { z } from "zod";

import { Database } from "./../../supabase/types";

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://eboto.app"
    : "http://localhost:3000";

export const PRICING = [
  {
    value: 0,
    price_added: 0,
    label: 1500,
  },
  {
    value: 20,
    price_added: 200,
    label: 2500,
  },
  {
    value: 40,
    price_added: 400,
    label: 5000,
  },
  {
    value: 60,
    price_added: 600,
    label: 7500,
  },
  {
    value: 80,
    price_added: 800,
    label: 10000,
  },
  {
    value: 100,
    label: -1,
  },
];

export const parseHourTo12HourFormat = (hour: number) => {
  if (hour === 0 || hour === 24) return "12 AM";
  else if (hour < 12) return `${hour} AM`;
  else if (hour === 12) return "12 PM";
  else return `${hour - 12} PM`;
};

export const isElectionEnded = ({
  election,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
}) => {
  return isAfter(
    new Date(),
    add(election.end_date, { hours: election.voting_hour_end }),
  );

  //   return moment().isAfter(
  //   moment(election.end_date).add(election.voting_hour_end, "hours"),
  // );
  // return (
  //   moment().isAfter(end_date, "day") &&
  //   now.getHours() >= election.voting_hour_end
  // );

  // return (
  //   now.getFullYear() >= end_date.getFullYear() &&
  //   now.getMonth() >= end_date.getMonth() &&
  //   now.getDate() >= end_date.getDate() &&
  //   now.getHours() >= election.voting_hour_end
  // );
};

export const isElectionOngoing = ({
  election,
  withoutHours,
}: {
  election: Database["public"]["Tables"]["elections"]["Row"];
  withoutHours?: true;
}) => {
  if (withoutHours) {
    return isWithinInterval(new Date(), {
      start: election.start_date,
      end: sub(add(election.end_date, { days: 1 }), { seconds: 1 }),
    });
  }

  // if (withoutHours) {
  //   return moment().isBetween(
  //     moment(election.start_date),
  //     moment(election.end_date).add(1, "day").subtract(1, "millisecond"),
  //   );
  // }

  return (
    isWithinInterval(new Date(), {
      start: add(election.start_date, { hours: election.voting_hour_start }),
      end: add(election.end_date, { hours: election.voting_hour_end }),
    }) &&
    isWithinInterval(new Date(), {
      start: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        election.voting_hour_start,
      ),
      end: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        election.voting_hour_end,
      ),
    })
  );
  // return (
  //   moment().isBetween(
  //     moment(election.start_date),
  //     moment(election.end_date).add(1, "day").subtract(1, "millisecond"),
  //   ) &&
  //   moment().get("hours") >= election.voting_hour_start &&
  //   moment().get("hours") < election.voting_hour_end
  // );

  // if (withoutHours) {
  //   return (
  //     now.getFullYear() >= start_date.getFullYear() &&
  //     now.getMonth() >= start_date.getMonth() &&
  //     now.getDate() >= start_date.getDate() &&
  //     now.getFullYear() <= end_date.getFullYear() &&
  //     now.getMonth() <= end_date.getMonth() &&
  //     now.getDate() <= end_date.getDate()
  //   );
  // }

  // return (
  //   now.getFullYear() >= start_date.getFullYear() &&
  //   now.getMonth() >= start_date.getMonth() &&
  //   now.getDate() >= start_date.getDate() &&
  //   now.getHours() >= election.voting_hour_start &&
  //   now.getFullYear() <= end_date.getFullYear() &&
  //   now.getMonth() <= end_date.getMonth() &&
  //   now.getDate() <= end_date.getDate() &&
  //   now.getHours() < election.voting_hour_end
  // );
};

export function formatName(
  arrangement: number,
  candidate: Database["public"]["Tables"]["candidates"]["Row"],
  isMiddleInitialOnly?: true,
) {
  const middle_name = isMiddleInitialOnly
    ? candidate.middle_name?.charAt(0) + "."
    : candidate.middle_name;

  if (arrangement === 0) {
    return `${candidate.first_name}${middle_name ? " " + middle_name : ""} ${
      candidate.last_name
    }`;
  } else if (arrangement === 1) {
    return `${candidate.last_name}, ${candidate.first_name}${
      candidate.middle_name ? " " + candidate.middle_name : ""
    }`;
  }

  return "No name";
}
export const electionDashboardNavbar: {
  id: number;
  label: string;
  path?: string;
  icon: React.ForwardRefExoticComponent<
    Omit<IconProps, "ref"> & React.RefAttributes<Icon>
  >;
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
    order: z.number(),
    id: z.string(),
    name: z.string(),
    organizations: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        positions: z.array(z.string()),
      }),
    ),
  }),
);

export type PositionTemplate = z.infer<typeof positionTemplateSchema>;

export const positionTemplate: PositionTemplate = [
  {
    order: 0,
    id: "no-template",
    name: "No template",
    organizations: [
      {
        id: "none",
        name: "None",
        positions: [],
      },
    ],
  },
  {
    order: 1,
    id: "general",
    name: "General Election Template",
    organizations: [
      {
        id: "ssg",
        name: "Supreme Student Government (SSG)",
        positions: [
          "President",
          "Vice President",
          "Secretary",
          "Treasurer",
          "Auditor",
          "Public Information Officer",
          "Peace Officer",
        ],
      },
    ],
  },
  {
    order: 2,
    id: "ceit",
    name: "CEIT - College of Engineering and Information Technology",
    organizations: [
      {
        id: "ceit-sc",
        name: "College of Engineering and Information Technology - SC",
        positions: [
          "President",
          "Vice President for Internal Affairs",
          "Vice President for External Affairs",
          "Vice President for Records and Documentation",
          "Vice President for Finance and Budget Management",
          "Vice President for Audit Planning and Risk Assessment",
          "Vice President for Operations and Implementation",
          "Vice President for Public Relations",
          "Vice President for Business Affairs and Procurement",
          "Vice President for Social and Environmental Awareness",
          "Vice President for Sports, Culture, and the Arts",
          "Vice President for Students Rights and Welfare",
        ],
      },
      {
        id: "csso",
        name: "Computer Science Student Organization - CSSO",
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
      },
      {
        id: "coess-icpep",
        name: "Computer Engineering Students Society - ICPEP",
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
      },
      {
        id: "iiee-csc",
        name: "Institute of Integrated Electrical Engineers - CSC",
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
      },
      {
        id: "piie",
        name: "Philippine Institute of Industrial Engineers - PIIE",
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
      },
    ],
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
  "register",
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
  "facebook",
  "twitter",
  "google",
  "github",
  "linkedin",
  "email",
  "cookie",
  "privacy",
  "terms",
  "disclaimer",
  "pricing",
  "billing",
];

export const FAQs: { id: string; question: string; answer: string }[] = [
  {
    id: "how-safe-is-eboto",
    question: "How safe is eBoto?",
    answer:
      "eBoto is an open-source software, which means that the source code is available to the public for review and improvement. Open-source software is generally considered safe because it allows for greater transparency and accountability in the development process.",
  },
  {
    id: "does-eboto-offer-real-time-vote-count",
    question: "Does eBoto offer real-time vote count?",
    answer:
      "Yes, eBoto provides a real-time vote count feature. However, during an ongoing election, the candidate's name in the real-time vote count page will not be revealed until the election has ended.",
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
    answer: `It depends on the election's publicity settings. eBoto offers three types of publicity settings: "Private" where only the election commissioner can see the election; "Voter" where the election is visible to both the commissioner and voters; and "Public" where the election's information and real-time vote count are publicly available.`,
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
    id: "is-eboto-only-available-at-cavite-state-university",
    question: "Is eBoto only available at Cavite State University?",
    answer:
      "No, eBoto is available for any type of organization that requires secure and flexible online voting.",
  },
  {
    id: "can-i-use-eboto-for-supreme-student-government-ssg-elections",
    question: "Can I use eBoto for Supreme Student Government (SSG) Elections?",
    answer:
      "Yes, eBoto offers a template for SSG Elections, and you can customize it further in the dashboard page to suit your specific requirements.",
  },
];

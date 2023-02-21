import { z } from "zod";

const positionTemplateSchema = z.array(
  z.object({
    id: z.number(),
    org: z.string(),
    positions: z.array(z.string()),
  })
);

export type PositionTemplate = z.infer<typeof positionTemplateSchema>;

export const positionTemplate: PositionTemplate = [
  { id: 0, org: "None", positions: [] },
  {
    id: 1,
    org: "CEIT-SC",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Vice President for Documentation",
      "Vice President for Finance",
      "Vice President for Budget Management",
      "Vice President for Operations",
      "Vice President for Public Relations",
      "Gender and Development Representative ",
    ],
  },
  {
    id: 2,
    org: "CSSO",
    positions: [
      "President",
      "Vice President for Internal Affairs",
      "Vice President for External Affairs",
      "Secretary",
      "Treasurer",
      "Auditor",
      "Business Manager",
      "Public Relations Officer",
    ],
  },
  {
    id: 3,
    org: "CoESS-ICPEP",
    positions: [
      "President",
      "Vice President for Internal Affair",
      "Vice President for External Affair",
      "Secretary",
      "Assistant Secretary",
      "Treasurer",
      "Auditor",
      "Business Manager",
      "Public Relations Officer",
    ],
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
  "profile",
];

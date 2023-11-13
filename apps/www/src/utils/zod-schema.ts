import { account_status_type } from "@eboto/db/schema";

export const account_status_type_with_accepted = [
  ...account_status_type,
  "ACCEPTED",
] as const;

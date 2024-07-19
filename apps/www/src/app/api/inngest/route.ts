import { serve } from "inngest/next";

import { inngest } from "@eboto/inngest";
import ElectionEnd from "@eboto/inngest/functions/election-end";
import ElectionStart from "@eboto/inngest/functions/election-start";

export const { GET, POST, PUT } = serve({
  client: inngest as any,
  functions: [ElectionStart as any, ElectionEnd],
});

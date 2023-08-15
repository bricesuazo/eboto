import { Box } from "@mantine/core";

// TODO: Remove this
//Error: The Edge Function "dashboard/[electionDashboardSlug]/*" size is 1.01 MB and your plan size limit is 1 MB. Learn More: https://vercel.link/edge-function-size
export const runtime = "nodejs";

export default function DashboardLayout(props: React.PropsWithChildren) {
  return <Box p="md">{props.children}</Box>;
}

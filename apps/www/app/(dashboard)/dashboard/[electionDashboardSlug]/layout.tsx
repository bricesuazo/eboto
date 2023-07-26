import { Box } from "@mantine/core";

// export const runtime = "edge";

export default function DashboardLayout(props: React.PropsWithChildren) {
  return <Box p="md">{props.children}</Box>;
}

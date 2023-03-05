import { Button, Group, Stack } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";

const ElectionDashboardHeader = ({ slug }: { slug: string }) => {
  const router = useRouter();

  return (
    <Group mb={4}>
      {["partylist", "position", "candidate", "voter", "settings"].map(
        (page) => (
          <Button
            key={page}
            variant={
              router.pathname.split("/").pop() === page ? "filled" : "default"
            }
            component={Link}
            href={"/dashboard/" + slug + "/" + page}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </Button>
        )
      )}
    </Group>
  );
};

export default ElectionDashboardHeader;

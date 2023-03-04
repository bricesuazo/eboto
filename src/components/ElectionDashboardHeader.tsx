import { Button, Stack } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";

const ElectionDashboardHeader = ({ slug }: { slug: string }) => {
  const router = useRouter();

  return (
    <Stack mb={4}>
      {["partylist", "position", "candidate", "voter", "settings"].map(
        (page) => (
          <Link href={"/dashboard/" + slug + "/" + page} key={page}>
            <Button
              variant={
                router.pathname.split("/").pop() === page ? "solid" : "outline"
              }
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </Button>
          </Link>
        )
      )}
    </Stack>
  );
};

export default ElectionDashboardHeader;

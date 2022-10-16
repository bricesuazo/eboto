import { Button, Center, Flex, Text } from "@chakra-ui/react";
import {
  ChartBarIcon as ChartBarIconOutline,
  CheckCircleIcon as CheckCircleIconOutline,
  Cog6ToothIcon as Cog6ToothIconOutline,
  FlagIcon as FlagIconOutline,
  UserCircleIcon as UserCircleIconOutline,
  UsersIcon as UsersIconOutline,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  FlagIcon as FlagIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  UsersIcon as UsersIconSolid,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/router";
const dashboardSidebar = [
  {
    title: "Overview",
    href: "/overview",
    icon: [
      <ChartBarIconSolid height={24} />,
      <ChartBarIconOutline height={24} />,
    ],
  },
  {
    title: "Partylist",
    href: "/partylist",
    icon: [<FlagIconSolid height={24} />, <FlagIconOutline height={24} />],
  },
  {
    title: "Position",
    href: "/position",
    icon: [<UsersIconSolid height={24} />, <UsersIconOutline height={24} />],
  },
  {
    title: "Candidate",
    href: "/candidate",
    icon: [
      <UserCircleIconSolid height={24} />,
      <UserCircleIconOutline height={24} />,
    ],
  },
  {
    title: "Voter",
    href: "/voter",
    icon: [
      <CheckCircleIconSolid height={24} />,
      <CheckCircleIconOutline height={24} />,
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: [
      <Cog6ToothIconSolid height={24} />,
      <Cog6ToothIconOutline height={24} />,
    ],
  },
];

const DashboardSidebar = () => {
  const router = useRouter();
  return (
    <Flex direction="column" gap={2}>
      {dashboardSidebar.map((item) => (
        <Link
          href={"/" + router.query.electionIdName + "/dashboard" + item.href}
          key={item.title}
        >
          <Button
            variant={
              item.title.toLocaleLowerCase() !== router.pathname.split("/")[3]
                ? "ghost"
                : "solid"
            }
            leftIcon={
              item.title.toLocaleLowerCase() === router.pathname.split("/")[3]
                ? item.icon[0]
                : item.icon[1]
            }
            justifyContent="flex-start"
            height={12}
          >
            <Text
              fontWeight={
                item.title.toLocaleLowerCase() !== router.pathname.split("/")[3]
                  ? "normal"
                  : "semibold"
              }
            >
              {item.title}
            </Text>
          </Button>
        </Link>
      ))}
    </Flex>
  );
};

export default DashboardSidebar;

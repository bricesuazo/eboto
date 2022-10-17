import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
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
    id: 1,
    title: "Overview",
    href: "/overview",
    icon: [
      {
        id: 1,
        icon: <ChartBarIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <ChartBarIconOutline height={24} />,
      },
    ],
  },
  {
    id: 2,
    title: "Partylist",
    href: "/partylist",
    icon: [
      {
        id: 1,
        icon: <FlagIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <FlagIconOutline height={24} />,
      },
    ],
  },
  {
    id: 3,
    title: "Position",
    href: "/position",
    icon: [
      {
        id: 1,
        icon: <UsersIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <UsersIconOutline height={24} />,
      },
    ],
  },
  {
    id: 4,
    title: "Candidate",
    href: "/candidate",
    icon: [
      {
        id: 1,
        icon: <UserCircleIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <UserCircleIconOutline height={24} />,
      },
    ],
  },
  {
    id: 5,
    title: "Voter",
    href: "/voter",
    icon: [
      {
        id: 1,
        icon: <CheckCircleIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <CheckCircleIconOutline height={24} />,
      },
    ],
  },
  {
    id: 6,
    title: "Settings",
    href: "/settings",
    icon: [
      {
        id: 1,
        icon: <Cog6ToothIconSolid height={24} />,
      },
      {
        id: 2,
        icon: <Cog6ToothIconOutline height={24} />,
      },
    ],
  },
];

const DashboardSidebar = () => {
  const router = useRouter();
  return (
    <Stack>
      {dashboardSidebar.map((item) => (
        <div key={item.id}>
          <Link
            href={"/" + router.query.electionIdName + "/dashboard" + item.href}
          >
            <Button
              variant={
                item.title.toLocaleLowerCase() !== router.pathname.split("/")[3]
                  ? "ghost"
                  : "solid"
              }
              key={item.id}
              leftIcon={
                item.title.toLocaleLowerCase() === router.pathname.split("/")[3]
                  ? item.icon[0].icon
                  : item.icon[1].icon
              }
              justifyContent="flex-start"
              height={12}
              width="100%"
            >
              <Text
                fontWeight={
                  item.title.toLocaleLowerCase() !==
                  router.pathname.split("/")[3]
                    ? "normal"
                    : "semibold"
                }
              >
                {item.title}
              </Text>
            </Button>
          </Link>
          {item.id === 1 && <Divider />}
          {item.id === 5 && <Divider />}
        </div>
      ))}
    </Stack>
  );
};

export default DashboardSidebar;

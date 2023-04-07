import {
  Container,
  Flex,
  UnstyledButton,
  Text,
  Center,
  Box,
  Select,
  Divider,
} from "@mantine/core";
import { IconLock, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/router";

const AccountSettingsLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const options = [
    {
      id: 0,
      label: "Account",
      value: "",
      icon: IconUser,
    },
    {
      id: 1,
      label: "Password",
      value: "change-password",
      icon: IconLock,
    },
  ];

  return (
    <Container h="100%" p={0}>
      <Flex h="100%">
        <Box
          p="sm"
          sx={(theme) => ({
            width: "16rem",

            [theme.fn.smallerThan("sm")]: {
              width: "12rem",
            },
            [theme.fn.smallerThan("xs")]: {
              display: "none",
            },
          })}
        >
          {options.map((option) => (
            <UnstyledButton
              key={option.id}
              component={Link}
              href={`/account/${option.value}`}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                columnGap: theme.spacing.xs,
                borderRadius: theme.radius.sm,
                padding: theme.spacing.xs,
                color:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[0]
                    : theme.colors.gray[7],
                backgroundColor:
                  (router.pathname.split("/")[2] ?? "") === option.value
                    ? theme.colorScheme === "dark"
                      ? theme.colors.dark[6]
                      : theme.colors.gray[1]
                    : "transparent",

                "&:hover": {
                  backgroundColor:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.colors.gray[0],
                },
              })}
            >
              <Center>
                <option.icon size="1.25rem" />
              </Center>
              <Text size="sm">{option.label}</Text>
            </UnstyledButton>
          ))}
        </Box>
        <Divider
          orientation="vertical"
          sx={(theme) => ({
            [theme.fn.smallerThan("xs")]: { display: "none" },
          })}
        />
        <Box sx={{ flex: 1 }} p="sm">
          <Select
            data={options.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            value={router.pathname.split("/")[2] ?? ""}
            onChange={(value) => router.push(`/account/${value ?? ""}`)}
            sx={(theme) => ({
              display: "none",
              [theme.fn.smallerThan("xs")]: {
                display: "block",
                marginBottom: theme.spacing.md,
              },
            })}
          />
          {children}
        </Box>
      </Flex>
    </Container>
  );
};

export default AccountSettingsLayout;

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Button,
  CheckIcon,
  Combobox,
  ComboboxDropdown,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTarget,
  Container,
  Divider,
  Flex,
  Group,
  InputBase,
  InputPlaceholder,
  Stack,
  useCombobox,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";

export default function AccountPageLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const combobox = useCombobox();

  const options = [
    {
      id: 0,
      label: "Account",
      value: "",
      icon: IconUser,
    },
    // {
    //   id: 1,
    //   label: "Billing",
    //   value: "billing",
    //   icon: IconCreditCard,
    // },
  ];

  return (
    <Container h="100%" p="md">
      <Flex h="100%" gap="md">
        <Stack gap={4} w={{ base: "12rem", sm: "16rem" }} visibleFrom="xs">
          {options.map((option) => (
            <Button
              key={option.id}
              component={Link}
              href={`/account/${option.value}`}
              variant={
                pathname?.split("/account")[1] === option.value
                  ? "light"
                  : "subtle"
              }
              size="md"
              justify="left"
              leftSection={<option.icon size="1.25rem" />}
              fw="normal"
              fz="sm"
            >
              {option.label}
            </Button>
          ))}
        </Stack>
        <Divider orientation="vertical" visibleFrom="xs" />
        <Box style={{ flex: 1 }}>
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              router.push(`/account/${val}`);
              combobox.closeDropdown();
            }}
          >
            <ComboboxTarget>
              <InputBase
                component="button"
                pointer
                rightSection={<Combobox.Chevron />}
                onClick={() => combobox.toggleDropdown()}
                mb="md"
                hiddenFrom="xs"
              >
                {options.find(
                  (option) => option.value === pathname?.split("/account")[1],
                )?.label ?? <InputPlaceholder>Select page</InputPlaceholder>}
              </InputBase>
            </ComboboxTarget>

            <ComboboxDropdown hiddenFrom="xs">
              <ComboboxOptions>
                {options.map((option) => (
                  <ComboboxOption
                    value={option.value}
                    key={option.id}
                    active={
                      options.find(
                        (option) =>
                          option.value === pathname?.split("/account")[1],
                      )?.value === option.value
                    }
                  >
                    <Group gap="xs">
                      {options.find(
                        (option) =>
                          option.value === pathname?.split("/account")[1],
                      )?.value === option.value && <CheckIcon size={12} />}
                      <span>{option.label}</span>
                    </Group>
                  </ComboboxOption>
                ))}
              </ComboboxOptions>
            </ComboboxDropdown>
          </Combobox>
          {children}
        </Box>
      </Flex>
    </Container>
  );
}

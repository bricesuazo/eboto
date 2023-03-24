import { Flex, Stack, TextInput, Button } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconLetterCase } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AccountSettingsLayout from "../../components/layouts/AccountSettings";
import { useEffect } from "react";

const AccountPage = () => {
  const session = useSession();
  const router = useRouter();

  const form = useForm<{
    firstName: string;
    middleName: string;
    lastName: string;
    image: string;
  }>({
    initialValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      image: "",
    },
    validateInputOnBlur: true,
    validate: {
      firstName: isNotEmpty("First name is required"),
      lastName: isNotEmpty("Last name is required"),
    },
  });

  useEffect(() => {
    if (session.status === "authenticated") {
      const data = {
        firstName: session.data.user.firstName,
        middleName: session.data.user.middleName ?? "",
        lastName: session.data.user.lastName,
        image: session.data.user.image ?? "",
      };

      form.setValues(data);
      form.resetDirty(data);
    }
  }, [session.status, router.pathname]);

  return (
    <AccountSettingsLayout>
      <form
        onSubmit={form.onSubmit((values) => {
          console.log(values);
        })}
      >
        <Stack>
          <Flex
            gap="sm"
            sx={(theme) => ({
              [theme.fn.smallerThan("sm")]: {
                flexDirection: "column",
              },
            })}
          >
            <TextInput
              placeholder="Enter your first name"
              withAsterisk
              label="First name"
              required
              {...form.getInputProps("firstName")}
              icon={<IconLetterCase size="1rem" />}
              disabled={session.status === "loading"}
            />
            <TextInput
              placeholder="Enter your middle name"
              label="Middle name"
              {...form.getInputProps("middleName")}
              icon={<IconLetterCase size="1rem" />}
              disabled={session.status === "loading"}
            />
            <TextInput
              placeholder="Enter your last name"
              withAsterisk
              label="Last name"
              required
              {...form.getInputProps("lastName")}
              icon={<IconLetterCase size="1rem" />}
              disabled={session.status === "loading"}
            />
          </Flex>

          <Button disabled={!form.isDirty()}>Update profile</Button>
        </Stack>
      </form>
    </AccountSettingsLayout>
  );
};

export default AccountPage;

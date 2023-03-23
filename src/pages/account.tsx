import { Alert, Button, Container, Stack, PasswordInput } from "@mantine/core";
import { useForm, isNotEmpty, matchesField } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconLock } from "@tabler/icons-react";
import { api } from "../utils/api";

const AccountPage = () => {
  const changePasswordMutation = api.user.changePassword.useMutation({
    onSuccess: () => {
      form.reset();
      notifications.show({
        title: "Password changed",
        message: "Your password has been changed successfully",
        icon: <IconCheck size="1.1rem" />,
        autoClose: 5000,
      });
    },
  });

  const form = useForm({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
    validateInputOnBlur: true,
    validate: {
      oldPassword: isNotEmpty("Old password is required"),
      newPassword: isNotEmpty("New password is required"),
      newPasswordConfirm: matchesField("newPassword", "Passwords do not match"),
    },
  });
  return (
    <Container>
      <form
        onSubmit={form.onSubmit((values) => {
          changePasswordMutation.mutate({
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
          });
        })}
      >
        <Stack spacing="sm">
          <PasswordInput
            placeholder="Old password"
            withAsterisk
            label="Old password"
            required
            {...form.getInputProps("oldPassword")}
            icon={<IconLock size="1rem" />}
            disabled={changePasswordMutation.isLoading}
          />
          <PasswordInput
            placeholder="New password"
            withAsterisk
            label="New password"
            required
            {...form.getInputProps("newPassword")}
            icon={<IconLock size="1rem" />}
            disabled={changePasswordMutation.isLoading}
          />
          <PasswordInput
            placeholder="Confirm new password"
            withAsterisk
            label="Confirm new password"
            required
            {...form.getInputProps("newPasswordConfirm")}
            icon={<IconLock size="1rem" />}
            disabled={changePasswordMutation.isLoading}
          />
          {changePasswordMutation.isError && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Error"
              color="red"
            >
              {changePasswordMutation.error.message}
            </Alert>
          )}
          <Button type="submit" loading={changePasswordMutation.isLoading}>
            Change password
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default AccountPage;

import { List, ListItem, rem, Text, ThemeIcon } from "@mantine/core";
import { IconCircleCheck } from "@tabler/icons-react";

export default function KeyFeatures({ isModal }: { isModal?: boolean }) {
  return (
    <>
      <Text
        fz="lg"
        fw={600}
        mt="lg"
        mb="xs"
        ta={isModal ? "center" : "initial"}
      >
        Key Features
      </Text>
      <List
        spacing="xs"
        size="sm"
        center
        icon={
          <ThemeIcon variant="gradient" size={24} radius="xl">
            <IconCircleCheck style={{ width: rem(16), height: rem(16) }} />
          </ThemeIcon>
        }
      >
        <ListItem>Ad-Free</ListItem>
        <ListItem>Live Support</ListItem>
        <ListItem>Realtime Chat w/ Voters</ListItem>
        <ListItem>Realtime Update</ListItem>
        <ListItem>No Watermark</ListItem>
      </List>
    </>
  );
}

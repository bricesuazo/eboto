import ContactForm from "@/components/client/components/contact-form";
import { Box, Container, Stack, Text, Title } from "@mantine/core";
import Balancer from "react-wrap-balancer";

export const dynamic = "force-static";

export default function ContactPage() {
  return (
    <Container py="xl">
      <Stack gap="xl">
        <Box>
          <Title ta="center">Contact Us</Title>
          <Text ta="center">
            <Balancer>
              We are happy to answer any questions you may have. Please reach
              out to us and we will respond as soon as we can.
            </Balancer>
          </Text>
        </Box>
        <ContactForm />
      </Stack>
    </Container>
  );
}

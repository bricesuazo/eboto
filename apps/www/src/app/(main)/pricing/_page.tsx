import classes from "@/styles/Pricing.module.css";
import { Box, Container, Text, Title } from "@mantine/core";
import Balancer from "react-wrap-balancer";

export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <Container py="xl">
      <Title ta="center">Pricing</Title>
      <Text ta="center">
        <Balancer>Unlock more features: Your Election Boost await.</Balancer>
      </Text>

      <Box mt="xl">
        <Box className={classes.card}>Free</Box>
      </Box>
    </Container>
  );
}

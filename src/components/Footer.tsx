import {
  ActionIcon,
  Container,
  Footer,
  Group,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandYoutube,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const FooterComponent = () => {
  const router = useRouter();
  return (
    <Footer height={60}>
      <Container
        h="100%"
        size={
          !router.pathname.includes("/dashboard/[electionSlug]")
            ? undefined
            : "full"
        }
      >
        <Group position="apart" w="100%" spacing={0} h="100%">
          <UnstyledButton component={Link} href="/">
            <Group spacing={4}>
              <Image
                src="/images/eboto-mo-logo.png"
                alt="eBoto Mo Logo"
                width={32}
                height={32}
              />
              <Text weight={600}>eBoto Mo</Text>
            </Group>
          </UnstyledButton>

          <Group spacing={0} noWrap>
            <ActionIcon
              component={Link}
              href="https://www.facebook.com/cvsueboto/"
              target="_blank"
              size="lg"
            >
              <IconBrandFacebook size="1.05rem" stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component={Link}
              href="https://twitter.com/cvsueboto"
              target="_blank"
              size="lg"
            >
              <IconBrandTwitter size="1.05rem" stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component={Link}
              href="https://www.youtube.com/@eboto-mo"
              target="_blank"
              size="lg"
            >
              <IconBrandYoutube size="1.05rem" stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component={Link}
              href="https://github.com/bricesuazo/eboto-mo"
              target="_blank"
              size="lg"
            >
              <IconBrandGithub size="1.05rem" stroke={1.5} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>
    </Footer>
  );
};

export default FooterComponent;

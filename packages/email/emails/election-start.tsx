import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { renderAsync } from "@react-email/render";

import { baseUrl } from "@eboto-mo/constants";

import { ses } from "../index";
import { config } from "../tailwind.config";

interface ElectionStartProps {
  isForCommissioner: boolean;
  emails: string[];

  election: {
    name: string;
    slug: string;
    start_date: Date;
    end_date: Date;
  };
}

export async function sendElectionStart(props: ElectionStartProps) {
  await ses.sendEmail({
    Source: process.env.EMAIL_FROM,
    Destination: {
      BccAddresses: props.emails,
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: `eBoto Mo: Election has started for ${props.election.name}`,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: await renderAsync(<ElectionStart {...props} />),
        },
      },
    },
  });
}

export default function ElectionStart(props: ElectionStartProps) {
  return (
    <Html>
      <Head />
      <Preview>eBoto Mo: Election Result for {props.election.name}</Preview>
      <Tailwind config={config}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto px-12 pt-5">
            <Img
              src={`https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/apps/www/public/images/logo.png`}
              width="42"
              height="42"
              alt="eBoto Mo"
              className="aspect-square rounded-full"
            />
            <Heading as="h1" className="text-2xl font-bold text-gray-800">
              Election has started for {props.election.name}
            </Heading>

            {props.isForCommissioner ? (
              <Text>
                Hello, you are receiving this email because you are a
                commissioner for the election: {props.election.name}. The
                election has started. Please inform the voters that they can now
                vote.
              </Text>
            ) : (
              <Text>
                Hello, you are receiving this email because you are a voter for
                the election: {props.election.name}. The election has started
                and you can now vote.
              </Text>
            )}
            <Section className="py-5">
              <Button
                style={{
                  padding: "11px 23px",
                  backgroundColor: "#5e6ad2",
                  borderRadius: "3px",
                  fontWeight: "600",
                  color: "#fff",
                  fontSize: "15px",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "block",
                }}
                href={`${baseUrl}/${props.election.slug}`}
              >
                View Election
              </Button>
            </Section>
            <Hr
              style={{
                borderColor: "#dfe1e4",
                margin: "42px 0 26px",
              }}
            />
            <Link
              href={baseUrl}
              style={{
                fontSize: "14px",
                color: "#b4becc",
              }}
            >
              eBoto Mo
            </Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

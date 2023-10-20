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
  render,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { baseUrl } from "@eboto-mo/constants";
import type { Candidate, Election, Position, Vote } from "@eboto-mo/db/schema";

import { ses } from "../index";

interface VoteCastedProps {
  email: string;
  election: Election & {
    positions: (Position & {
      votes: (Vote & {
        candidate: Candidate | null;
        position: Position | null;
      })[];
    })[];
  };
}

export async function sendVoteCasted(props: VoteCastedProps) {
  await ses.sendEmail({
    Source: process.env.EMAIL_FROM!,
    Destination: {
      ToAddresses: [props.email],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: `eResibo: You have successfully casted your vote in ${props.election.name}`,
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: render(<VoteCasted {...props} />),
        },
      },
    },
  });
}

export default function VoteCasted({ election }: VoteCastedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Resibo: You have successfully casted your vote in {election.name}
      </Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              accentColor: {
                50: "#E5FEEE",
                100: "#D2F9E0",
                200: "#A8F1C0",
                300: "#7AEA9F",
                400: "#53E383",
                500: "#3BDF70",
                600: "#2BDD66",
                700: "#1AC455",
                800: "#0CAF49",
                900: "#00963C",
              },
              colors: {
                brand: "#2BDD66",
              },
            },
          },
        }}
      >
        <Body
          className="bg-white"
          style={{
            backgroundColor: "#ffffff",
            fontFamily:
              '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
          }}
        >
          <Container
            style={{
              margin: "0 auto",
              padding: "20px 0 48px",
              width: "560px",
            }}
          >
            <Img
              src={`https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo.png`}
              width="42"
              height="42"
              alt="eBoto Mo"
              style={{
                borderRadius: 21,
                width: 42,
                height: 42,
              }}
            />
            <Heading
              style={{
                fontSize: "24px",
                letterSpacing: "-0.5px",
                lineHeight: "1.3",
                fontWeight: "600",
                color: "#484848",
                padding: "17px 0 0",
              }}
            >
              eResibo: You have successfully casted your vote in {election.name}
            </Heading>
            <Heading
              as="h4"
              style={{
                fontSize: "20px",
                letterSpacing: "-0.5px",
                lineHeight: "1.3",
                fontWeight: "600",
                color: "#484848",
                padding: "12px 0 0",
              }}
            >
              Your votes:
            </Heading>
            <Section>
              {/* {election.positions.map((position) => (
              <Text
                style={{
                  fontSize: "15px",
                  lineHeight: "1.5",
                  color: "#484848",
                  padding: "12px 0 0",
                }}
              >
                {position.name}: {vote.candidate?.name}
              </Text>
            ))} */}
            </Section>
            <Section
              style={{
                padding: "27px 0 27px",
              }}
            >
              <Button
                pY={11}
                pX={23}
                style={{
                  backgroundColor: "#5e6ad2",
                  borderRadius: "3px",
                  fontWeight: "600",
                  color: "#fff",
                  fontSize: "15px",
                  textDecoration: "none",
                  textAlign: "center" as const,
                  display: "block",
                }}
                href={`${baseUrl}/${election.slug}`}
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

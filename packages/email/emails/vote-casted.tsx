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
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { renderAsync } from "@react-email/render";

import { baseUrl } from "@eboto/constants";

import { ses } from "../index";
import { config } from "../tailwind.config";

interface VoteCastedProps {
  email: string;
  election: {
    name: string;
    slug: string;
    positions: {
      id: string;
      name: string;
      vote:
        | {
            isAbstain: true;
          }
        | {
            isAbstain: false;
            candidates: {
              id: string;
              name: string;
            }[];
          };
    }[];
  };
}

export async function sendVoteCasted(props: VoteCastedProps) {
  await ses.sendEmail({
    Source: "eBoto <contact@eboto.app>",
    ReplyToAddresses: [process.env.EMAIL_FROM ?? ""],
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
          Data: await renderAsync(<VoteCasted {...props} />),
        },
      },
    },
  });
}

export default function VoteCasted(props: VoteCastedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Resibo: You have successfully casted your vote in {props.election.name}
      </Preview>
      <Tailwind config={config}>
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
              src={`https://eboto.app/images/logo.png`}
              width="42"
              height="42"
              alt="eBoto"
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
              eResibo: You have successfully casted your vote in{" "}
              {props.election.name}
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
            <Row>
              {props.election.positions.map((position) => (
                <Section key={position.id}>
                  <Heading as="h3">{position.name}:</Heading>

                  {!position.vote.isAbstain ? (
                    position.vote.candidates.map((candidate) => (
                      <Text key={candidate.id}>- {candidate.name}</Text>
                    ))
                  ) : (
                    <Text>Abstain</Text>
                  )}
                </Section>
              ))}
            </Row>
            <Section
              style={{
                padding: "27px 0 27px",
              }}
            >
              <Button
                style={{
                  padding: "11px 23px",
                  backgroundColor: "#5e6ad2",
                  borderRadius: "3px",
                  fontWeight: "600",
                  color: "#fff",
                  fontSize: "15px",
                  textDecoration: "none",
                  textAlign: "center" as const,
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
              eBoto
            </Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

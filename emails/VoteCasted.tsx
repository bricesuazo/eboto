import type { Candidate, Election, Position } from "@prisma/client";
import { Body } from "@react-email/body";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Img } from "@react-email/img";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";

interface VoteCastedProps {
  votes: { position: Position; votes: Candidate[] }[];
  election: Election;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://eboto-mo.com"
    : process.env.VERCEL_ENV === "preview"
    ? "https://eboto-mo-git-dev-bricesuazo.vercel.app"
    : process.env.VERCEL_ENV === "development"
    ? "http://localhost:3000"
    : "https://eboto-mo.com";

export default function VoteCasted({ votes, election }: VoteCastedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Resibo: You have successfully casted your vote in {election.name}
      </Preview>
      <Body
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
            Resibo: You have successfully casted your vote in {election.name}
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
            {votes.map((vote) => (
              <Section key={vote.position.id} style={{ marginBottom: 16 }}>
                <Heading
                  style={{
                    fontSize: "16px",
                    fontWeight: "400",
                    margin: 4,
                  }}
                >
                  {vote.position.name}:
                </Heading>
                <Section
                  style={{
                    marginLeft: 16,
                  }}
                >
                  {!vote.votes.length ? (
                    <Text
                      style={{
                        margin: 0,
                      }}
                    >
                      - Abstain
                    </Text>
                  ) : (
                    vote.votes.map((candidate) => (
                      <Text
                        key={candidate.id}
                        style={{
                          margin: 0,
                        }}
                      >
                        - {candidate.last_name}, {candidate.first_name}
                        {candidate.middle_name
                          ? ` ${candidate.middle_name}`
                          : ""}
                      </Text>
                    ))
                  )}
                </Section>
              </Section>
            ))}
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
    </Html>
  );
}

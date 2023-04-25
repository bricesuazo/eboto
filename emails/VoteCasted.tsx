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
  electionName: string;
  electionSlug: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://eboto-mo.com"
    : process.env.VERCEL_ENV === "preview"
    ? "https://eboto-mo-git-dev-bricesuazo.vercel.app"
    : process.env.VERCEL_ENV === "development"
    ? "http://localhost:3000"
    : "https://eboto-mo.com";

export default function VoteCasted({
  electionName,
  electionSlug,
}: VoteCastedProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Resibo: You have successfully casted your vote in {electionName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo.png`}
            width="42"
            height="42"
            alt="eBoto Mo"
            style={logo}
          />
          <Heading style={heading}>
            Resibo: You have successfully casted your vote in {electionName}
          </Heading>
          <Section style={buttonContainer}>
            <Button
              pY={11}
              pX={23}
              style={button}
              href={`${baseUrl}/${electionSlug}`}
            >
              View Election
            </Button>
          </Section>

          <Hr style={hr} />
          <Link href={baseUrl} style={reportLink}>
            eBoto Mo
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

const logo = {
  borderRadius: 21,
  width: 42,
  height: 42,
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "560px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const buttonContainer = {
  padding: "27px 0 27px",
};

const button = {
  backgroundColor: "#5e6ad2",
  borderRadius: "3px",
  fontWeight: "600",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
};

const reportLink = {
  fontSize: "14px",
  color: "#b4becc",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "42px 0 26px",
};

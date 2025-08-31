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
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

import { baseUrl } from '@eboto/constants';

import { ses } from '../index';

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
    Source: 'eBoto <contact@eboto.app>',
    ReplyToAddresses: process.env.EMAIL_FROM ? [process.env.EMAIL_FROM] : [],
    Destination: {
      BccAddresses: props.emails,
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: `eBoto: Election has started for ${props.election.name}`,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: await render(<ElectionStart {...props} />),
        },
      },
    },
  });
}

export default function ElectionStart(props: ElectionStartProps) {
  return (
    <Html>
      <Head />
      <Preview>eBoto: Election Result for {props.election.name}</Preview>
      <Body
        style={{
          backgroundColor: '#ffffff',
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
        }}
      >
        <Container
          style={{
            margin: '0 auto',
            padding: '20px 48px 0 48px',
          }}
        >
          <Img
            src={`https://eboto.app/images/logo.png`}
            width="42"
            height="42"
            alt="eBoto"
            style={{
              aspectRatio: '1 / 1',
              borderRadius: 21,
              width: 42,
              height: 42,
            }}
          />
          <Heading
            as="h1"
            style={{
              fontSize: '24px',
              letterSpacing: '-0.5px',
              lineHeight: '1.3',
              fontWeight: '600',
              color: '#484848',
              padding: '17px 0 0',
            }}
          >
            Election has started for {props.election.name}
          </Heading>

          {props.isForCommissioner ? (
            <Text>
              Hello, you are receiving this email because you are a commissioner
              for the election: {props.election.name}. The election has started.
              Please inform the voters that they can now vote.
            </Text>
          ) : (
            <Text>
              Hello, you are receiving this email because you are a voter for
              the election: {props.election.name}. The election has started and
              you can now vote.
            </Text>
          )}
          <Section
            className="py-5"
            style={{
              padding: '0 20px',
            }}
          >
            <Button
              style={{
                padding: '11px 23px',
                backgroundColor: '#5e6ad2',
                borderRadius: '3px',
                fontWeight: '600',
                color: '#fff',
                fontSize: '15px',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
              }}
              href={`${baseUrl}/${props.election.slug}`}
            >
              View Election
            </Button>
          </Section>
          <Hr
            style={{
              borderColor: '#dfe1e4',
              margin: '42px 0 26px',
            }}
          />
          <Link
            href={baseUrl}
            style={{
              fontSize: '14px',
              color: '#b4becc',
            }}
          >
            eBoto
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

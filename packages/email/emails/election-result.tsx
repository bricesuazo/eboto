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
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

import { baseUrl } from '@eboto/constants';

import { ses } from '../index';

interface ElectionResultProps {
  emails: string[];
  election: {
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    positions: {
      id: string;
      name: string;
      abstain_count: number;

      candidates: {
        id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        vote_count: number;
      }[];
    }[];
  };
}

export async function sendElectionResult(props: ElectionResultProps) {
  await ses.sendEmail({
    Source: 'eBoto <contact@eboto.app>',
    ReplyToAddresses: process.env.EMAIL_FROM ? [process.env.EMAIL_FROM] : [],
    Destination: {
      BccAddresses: props.emails,
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: `eBoto: Election Result for ${props.election.name}`,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: await render(<ElectionResult {...props} />),
        },
      },
    },
  });
}

export default function ElectionResult(props: ElectionResultProps) {
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
            padding: '20px 0 48px',
            width: '560px',
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
              fontSize: '24px',
              letterSpacing: '-0.5px',
              lineHeight: '1.3',
              fontWeight: '600',
              color: '#484848',
              padding: '17px 0 0',
            }}
          >
            Election Result for {props.election.name}
          </Heading>
          <Heading
            as="h4"
            style={{
              fontSize: '20px',
              letterSpacing: '-0.5px',
              lineHeight: '1.3',
              fontWeight: '600',
              color: '#484848',
              padding: '12px 0 0',
            }}
          >
            Result
          </Heading>
          <Row>
            {props.election.positions.map((position) => (
              <Section key={position.id}>
                <Heading as="h3">{position.name}:</Heading>

                {position.candidates.map((candidate) => (
                  <Text key={candidate.id}>
                    {candidate.first_name}{' '}
                    {candidate.middle_name ? candidate.middle_name + ' ' : ''}{' '}
                    {candidate.last_name} - ({candidate.vote_count} votes)
                  </Text>
                ))}
                <Text>Abstain - ({position.abstain_count} votes)</Text>
              </Section>
            ))}
          </Row>
          <Section
            style={{
              padding: '27px 0 27px',
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
                textAlign: 'center' as const,
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

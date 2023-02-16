import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
} from "@react-pdf/renderer";

import Moment from "react-moment";
import { candidateType, electionType, positionType } from "../types/typings";

// Create Document Component
const GenerateResult = ({
  election,
  positions,
  candidates,
}: {
  election: electionType;
  positions: positionType[];
  candidates: candidateType[];
}) => {
  return (
    <Document>
      <Page
        size="A4"
        style={{
          fontSize: 12,
        }}
      >
        <View style={{ margin: 32 }}>
          <View
            style={{
              flexDirection: "column",
              textAlign: "center",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <View>
              {/* {election.logoUrl && (
            <PdfImage
              src={election.logoUrl}
              // style={styles.electionLogo}
            />
          )} */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {election.name}
              </Text>
              <Text>https://eboto-mo.com/{election.electionIdName}</Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Moment format="MMMM DD, YYYY, hA" element={Text}>
                  {election.electionStartDate.seconds * 1000}
                </Moment>
                <Text> - </Text>

                <Moment format="MMMM DD, YYYY, hA" element={Text}>
                  {election.electionEndDate.seconds * 1000}
                </Moment>
              </View>
            </View>

            <View>
              <Text>Generated on:</Text>

              <Moment format="MMMM DD, YYYY, h:mmA" element={Text}>
                {new Date()}
              </Moment>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              Results
            </Text>
          </View>

          <View
            style={{
              fontSize: 12,
            }}
          >
            {positions
              ?.sort((a, b) => a.order - b.order)
              .map((position) => {
                return (
                  <View key={position.uid} style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      {position.title}
                    </Text>

                    {candidates
                      ?.filter(
                        (candidate) => candidate.position === position.uid
                      )
                      .sort((a, b) => b.votingCount - a.votingCount)
                      .map((candidate, idx) => {
                        return (
                          <View
                            key={candidate.uid}
                            style={{
                              marginBottom: 4,
                            }}
                          >
                            <Text>{`${candidate.lastName}, ${
                              candidate.firstName
                            }${
                              candidate.middleName && " " + candidate.middleName
                            }${idx === 0 ? " - Winner" : ""}`}</Text>
                            <Text>{candidate.votingCount} votes</Text>
                          </View>
                        );
                      })}

                    <Text>Abstain - {position.undecidedVotingCount} votes</Text>
                  </View>
                );
              })}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default GenerateResult;

import {
  Document,
  Page,
  Text,
  View,
  // StyleSheet,
  // Image,
} from "@react-pdf/renderer";

import Moment from "react-moment";

// Create styles
// const styles = StyleSheet.create({
//   page: {
//     flexDirection: "row",
//   },
// });

export interface ResultType {
  result: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    start_date: Date;
    end_date: Date;
    voting_start: number;
    voting_end: number;
    positions: {
      id: string;
      name: string;
      votes: number;
      candidates: {
        id: string;
        name: string;
        votes: number;
      }[];
    }[];
  };
}

// Create Document Component
const GenerateResult = ({ result }: ResultType) => (
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            {result.name}
          </Text>
          <Text>https://eboto-mo.com/{result.slug}</Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Moment
              format="MMMM DD, YYYY, hA"
              element={Text}
              date={result.start_date}
            />
            <Text> - </Text>

            <Moment
              format="MMMM DD, YYYY, hA"
              element={Text}
              date={result.end_date}
            />
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
        {result.positions
          // ?.sort((a, b) => a.order - b.order)
          .map((position) => {
            return (
              <View key={position.id} style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  {position.name}
                </Text>

                {position.candidates
                  .sort((a, b) => b.votes - a.votes)
                  .map((candidate) => {
                    return (
                      <View
                        key={candidate.id}
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        <Text>{candidate.name}</Text>
                        <Text>{candidate.votes} vote/s</Text>
                      </View>
                    );
                  })}

                <Text>Abstain - {position.votes} vote/s</Text>
              </View>
            );
          })}
      </View>
    </Page>
  </Document>
);

export default GenerateResult;

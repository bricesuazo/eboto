import {
  Document,
  Page,
  Image as PdfImage,
  Text,
  View,
} from "@react-pdf/renderer";

export interface ResultType {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  start_date: Date;
  end_date: Date;
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
}

export default function GenerateResult({ result }: { result: ResultType }) {
  return (
    <Document>
      <Page
        size="A4"
        style={{
          fontFamily: "Helvetica",
          padding: 40,
          fontSize: 12,
          paddingBottom: 80,
        }}
      >
        <Text
          style={{
            position: "absolute",
            fontSize: 9,
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: "center",
            color: "grey",
          }}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View style={{ display: "flex", alignItems: "center" }}>
            <PdfImage
              src="https://raw.githubusercontent.com/bricesuazo/eboto-mo/main/public/images/eboto-mo-logo.png"
              style={{ width: 32, height: 32 }}
            />
            <Text
              style={{
                fontWeight: 20,
                fontFamily: "Helvetica-Bold",
                color: "#2f9e44",
              }}
            >
              eBoto Mo
            </Text>
          </View>
        </View>
        <View>
          <View
            style={{
              flexDirection: "column",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {result.logo && (
              <PdfImage
                src={result.logo}
                style={{
                  display: "flex",
                  width: 80,
                  height: 80,
                  alignSelf: "center",
                }}
              />
            )}
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 18,
              }}
            >
              {result.name}
            </Text>
            <Text>https://eboto-mo.com/{result.slug}</Text>
            <Text>
              {result.start_date.toLocaleString("en-US", {
                timeZone: "Asia/Manila",
              })}
              {" - "}
              {result.end_date.toLocaleString("en-US", {
                timeZone: "Asia/Manila",
              })}
            </Text>
            <View style={{ marginVertical: 8 }}>
              <Text>Generated on:</Text>

              <Text>
                {new Date().toLocaleString("en-US", {
                  timeZone: "Asia/Manila",
                })}
              </Text>
            </View>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Results</Text>
          </View>

          <View
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              alignItems: "center",
            }}
          >
            {result.positions.map((position) => {
              return (
                <View
                  key={position.id}
                  style={{
                    width: 400,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        textAlign: "center",
                        fontFamily: "Helvetica-Bold",
                      }}
                    >
                      {position.name}
                    </Text>
                    <Text
                      style={{
                        textAlign: "center",
                      }}
                    >
                      Abstain Count - {position.votes}
                    </Text>
                  </View>

                  <View>
                    {position.candidates
                      .sort((a, b) => b.votes - a.votes)
                      .map((candidate, idx) => {
                        return (
                          <View
                            key={candidate.id}
                            style={{
                              marginBottom: 4,
                              backgroundColor:
                                idx === 0 ? "#90ee90" : "transparent",
                              padding: 8,
                            }}
                          >
                            <Text>{candidate.name}</Text>
                            <Text>
                              <Text
                                style={{
                                  fontFamily: "Helvetica-Bold",
                                }}
                              >
                                {candidate.votes}
                              </Text>{" "}
                              vote{candidate.votes > 1 && "s"}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );
}

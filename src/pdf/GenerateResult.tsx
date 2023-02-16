import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import Moment from "react-moment";
import { electionType } from "../types/typings";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
  },
});

// Create Document Component
const GenerateResult = ({ election }: { election: electionType }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text>{election.name}</Text>
        <Text>https://eboto-mo.com/{election.electionIdName}</Text>
        <Text>Election start date:</Text>
        <Moment format="MMMM DD, YYYY, hA" element={Text}>
          {election.electionStartDate.seconds * 1000}
        </Moment>
        <Text>Election end date:</Text>

        <Moment format="MMMM DD, YYYY, hA" element={Text}>
          {election.electionEndDate.seconds * 1000}
        </Moment>
      </View>
      <View>
        {election.logoUrl && (
          <Image
            src={election.logoUrl}
            style={{
              width: 100,
              height: 100,
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        )}
      </View>
    </Page>
  </Document>
);

export default GenerateResult;

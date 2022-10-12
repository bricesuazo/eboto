import { collection, getDocs, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import { electionType } from "../../types/typings";
import { firestore } from "../../firebase/firebase";

const ElectionPage = ({ election }: { election: electionType }) => {
  return <div>ElectionPage</div>;
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const electionQuery = query(
    collection(firestore, "elections"),
    where("electionIdName", "==", context.query.electionIdName)
  );
  const electionSnapshot = await getDocs(electionQuery);
  if (electionSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
    },
  };
};

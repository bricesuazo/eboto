import { ImageResponse } from "@vercel/og";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest } from "next/server";
import { firestore } from "../../../firebase/firebase";
import { candidateType, electionType } from "../../../types/typings";

export const config = {
  runtime: "experimental-edge",
};

export default function (req: NextRequest) {
  //   const { electionIdName, candidateSlug } = req.;
  const electionIdName = req.nextUrl.pathname.split("/")[2];
  const candidateSlug = req.nextUrl.pathname.split("/")[3];
  // if (!electionIdName && !candidateSlug) {
  //   return new ImageResponse(<>Visit with &quot;?username=vercel&quot;</>, {
  //     width: 1200,
  //     height: 630,
  //   });
  // }
  // const electionSnapshot = await getDocs(
  //   query(
  //     collection(firestore, "elections"),
  //     where("electionIdName", "==", electionIdName)
  //   )
  // );
  // const candidateSnapshot = await getDocs(
  //   query(
  //     collection(
  //       firestore,
  //       "elections",
  //       electionSnapshot.docs[0].data().uid,
  //       "candidates"
  //     ),
  //     where("slug", "==", candidateSlug)
  //   )
  // );
  // const election = electionSnapshot.docs[0].data() as electionType;
  // const candidate = candidateSnapshot.docs[0].data() as candidateType;
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* {election.name} -
        {`${candidate.firstName}${
          candidate.middleName && ` ${candidate.middleName}`
        } ${candidate.lastName}`} */}
        {electionIdName} - {candidateSlug}
      </div>
    ),
    {
      width: 1200,
      height: 600,
    }
  );
}

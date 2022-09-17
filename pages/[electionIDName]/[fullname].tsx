// import { useContext, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import ElectionContext from "../context/ElectionContext";

// const CandidateCredential = () => {
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);
//   const { currentCandidates } = useContext(ElectionContext);
//   const { fullname } = useParams();

//   const candidate = currentCandidates?.find(
//     ({ firstName, lastName }) =>
//       `${firstName.replaceAll(" ", "").toLowerCase()}-${lastName
//         .replaceAll(" ", "")
//         .toLowerCase()}` === fullname
//   );

//   const listOutput = (lists) => {
//     if (lists?.length !== 0) {
//       return lists?.map((list, i) => {
//         return <li key={i}>{list}</li>;
//       });
//     } else {
//       return "None";
//     }
//   };
//   return (
//     <div className="flex flex-col items-center sm:items-start sm:flex-row relative">
//       <img
//         src={candidate.img}
//         alt=""
//         className="aspect-square sm:aspect-auto object-cover sm:w-1/3 sm:sticky top-0 sm:h-screen"
//       />
//       <div className="px-4 sm:px-8 py-4  flex flex-col text-center sm:text-left gap-y-2 sm:mt-8">
//         <div className="flex flex-col">
//           <span className="font-bold text-xl sm:text-4xl">
//             {candidate.firstName}{" "}
//             {candidate.middleName.length === 1
//               ? candidate.middleName + "."
//               : candidate.middleName}{" "}
//             {candidate.lastName}
//           </span>
//           <span className="sm:text-xl">
//             {candidate.partylist.title} ({candidate.partylist.acronym})
//           </span>
//         </div>
//         <div>
//           <span>
//             Running for{" "}
//             <span className="font-semibold">{candidate.position.title}</span>
//           </span>
//         </div>
//         <div className="mt-8">
//           <span className="font-semibold">Significant Achievement(s):</span>
//           <div className="text-left list-disc">
//             {listOutput(candidate.significantAchievements)}
//           </div>
//         </div>
//         <div className="">
//           <span className="font-semibold">Leadership Achievement(s):</span>
//           <div className="text-left list-disc">
//             {listOutput(candidate.leadershipAchievements)}
//           </div>
//         </div>
//         <div className="text-left mt-12">
//           <div className="font-bold text-xl mb-2">
//             {candidate.question.question}
//           </div>
//           <div className="list-none">
//             <div>
//               {candidate.question.answer.map((ans, i) => {
//                 return (
//                   <div key={i} className="mb-4">
//                     {ans}
//                   </div>
//                 );
//               })}
//             </div>
//             <br />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CandidateCredential;

import React from "react";

const CandidateCredential = () => {
  return <div>CandidateCredential</div>;
};

export default CandidateCredential;

// import { useContext, useEffect } from "react";
// // import SliderChart from "../components/SliderChart";
// import ElectionContext from "../context/ElectionContext";

// const ElectionRealtime = () => {
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);
//   const { currentCandidates, currentVoterLoggedIn } =
//     useContext(ElectionContext);
//   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   return (
//     <div className="p-4 md:p-8 lg:p-12 flex flex-col gap-y-4">
//       <div className="font-bold text-2xl text-center">
//         {currentVoterLoggedIn?.election?.name}
//       </div>
//       <div className="flex flex-col md:grid grid-cols-2 gap-2 lg:grid-cols-3 lg:justify-center">
//         {currentVoterLoggedIn?.election?.positions.map((position) => {
//           return (
//             <div
//               key={position.id}
//               className="border-2 h-fit rounded flex items-center overflow-hidden py-2"
//             >
//               <div className="w-full">
//                 <div className="font-bold text-xl w-full text-center pb-2">
//                   {position.title}
//                 </div>
//                 {currentCandidates
//                   .filter(
//                     (candidatePosition) =>
//                       position.title === candidatePosition?.position.title
//                   )
//                   .sort((a, b) => {
//                     return b.votingCount - a.votingCount;
//                   })
//                   .map((candidate, i) => {
//                     return (
//                       <div
//                         key={candidate.id}
//                         className="flex p-4 border-y py-2 gap-4 hover:bg-gray-100 items-center"
//                       >
//                         <div className="flex flex-col w-full ">
//                           <span>
//                             <span className="font-bold">
//                               {currentVoterLoggedIn.election?.ongoing
//                                 ? "Candidate " + letters[i]
//                                 : `${candidate.lastName}, ${
//                                     candidate.firstName
//                                   } ${
//                                     candidate.middleName !== ""
//                                       ? candidate.middleName != null
//                                         ? candidate.middleName
//                                             .charAt(0)
//                                             .toUpperCase()
//                                             .concat(".")
//                                         : ""
//                                       : ""
//                                   }
//                             `}
//                             </span>
//                           </span>
//                           {/* <SliderChart percent={50} /> */}
//                         </div>
//                         <span className="font-bold text-lg w-12 text-center">
//                           {candidate.votingCount}
//                         </span>
//                       </div>
//                     );
//                   })}
//                 <div className="flex p-4 border-y py-2 gap-4 hover:bg-gray-100 items-center font-bold">
//                   <div className="w-full">
//                     <span>Undecided</span>
//                     {/* <SliderChart percent={50} /> */}
//                   </div>
//                   <div className="font-bold text-lg w-12 text-center">
//                     {position.undecidedVotingCount}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ElectionRealtime;

const ElectionRealtime = () => {
  return <div>ElectionRealtime</div>;
};

export default ElectionRealtime;

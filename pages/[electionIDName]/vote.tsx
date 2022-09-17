// import VoteCard from "../components/VoteCard";
// // import candidateImg1 from "../assets/imgs/election/candidates/1.png";
// import { useState } from "react";
// import { CgCheckO } from "react-icons/cg";
// import Card from "../components/Card";
// import Button from "../../components/styled/Button";
// import { useContext, useEffect } from "react";
// import ElectionContext from "../context/ElectionContext";

// const ElectionVote = ({ voter }) => {
//   const [popupCard, setPopupCard] = useState(false);
//   const { currentCandidates, selection, setSelection } =
//     useContext(ElectionContext);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//     setSelection([]);
//   }, [setSelection]);

//   selection.sort((a, b) => {
//     return a.position.id - b.position.id;
//   });

//   const addUndecided = (position) => {
//     const filteredCandidatesByPosition = currentCandidates.filter(
//       (unsortedFilteredCandidate) =>
//         position.title === unsortedFilteredCandidate?.position.title
//     );
//     filteredCandidatesByPosition.push({
//       id: -1,
//       name: "Undecided",
//       position: { id: position.id },
//     });
//     return filteredCandidatesByPosition;
//   };
//   return (
//     <div>
//       {voter.hasVoted && (
//         <div className="fixed h-full w-full bg-black-50 text-white z-20 grid place-items-center text-xl font-bold text-center">
//           You already voted. You can&apos;t vote now.
//         </div>
//       )}

//       <div
//         className={`m-auto text-center z-0 ${
//           voter.hasVoted ? "pointer-events-none select-none" : ""
//         }`}
//       >
//         <div className="w-full bg-election-cover bg-no-repeat bg-center bg-cover overflow-hidden ">
//           <div className="h-80 flex items-center justify-center bg-black-50">
//             <span className="text-white text-4xl font-bold">
//               {voter?.election?.name}
//             </span>
//           </div>
//         </div>

//         {!voter.hasVoted && (
//           <>
//             <div className="font-bold text-4xl mt-8">You can vote now!</div>
//             <div className="mt-2">
//               Always remember to
//               <span className="font-bold text-primary"> vote wisely!</span>
//             </div>
//           </>
//         )}
//         <div className="flex flex-col gap-y-8 py-16">
//           {voter?.election?.positions.map((position) => (
//             <div key={position.id} className="flex flex-col">
//               <span className="text-2xl font-semibold">{position.title}</span>
//               <div
//                 className="flex gap-x-2 md:gap-x-4 justify-left md:justify-center overflow-x-auto px-8 py-4 items-center"
//                 onChange={(e) => {
//                   const pos1 = parseInt(e.target.value.split(", ")[0]);
//                   const pos2 = parseInt(e.target.value.split(", ")[1]);

//                   const pushToArray = {
//                     position: voter?.election?.positions[pos1],
//                     candidates:
//                       pos2 !== -1
//                         ? currentCandidates[pos2]
//                         : { id: -1, name: "Undecided" },
//                   };

//                   const item = selection?.find((x) => x.position.id === pos1);
//                   if (item) {
//                     selection[pos1] = pushToArray;
//                   } else {
//                     setSelection((oldArray) => [...oldArray, pushToArray]);
//                   }
//                 }}
//               >
//                 {addUndecided(position).map((filteredCandidate) => {
//                   return (
//                     <VoteCard
//                       key={filteredCandidate.id}
//                       candidate={filteredCandidate}
//                       voterCanVote={voter.hasVoted}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//           <div onClick={() => setPopupCard(true)}>
//             <Button
//               disabled={
//                 !voter.hasVoted &&
//                 !(selection.length === voter.election?.positions.length)
//               }
//             >
//               Cast vote
//             </Button>
//           </div>
//           {popupCard && (
//             <Card
//               title="Confirm vote"
//               titleIcon={<CgCheckO />}
//               center
//               popupCard={popupCard}
//               setPopupCard={setPopupCard}
//               redirect="./../realtime"
//               buttonOnClick={() =>
//                 selection.forEach((select) => {
//                   if (select.candidates.id === -1) {
//                     select.position.undecidedVotingCount += 1;
//                   } else if (select.candidates.id !== -1) {
//                     currentCandidates[select.candidates.id].votingCount += 1;
//                   }
//                   setSelection([]);
//                   voter.hasVoted = true;
//                 })
//               }
//             >
//               <div className="">
//                 {selection.map((selected) => (
//                   <div
//                     key={selected.position.id}
//                     className="flex justify-between"
//                   >
//                     <span className="text-left">{selected.position.title}</span>
//                     <span className="font-bold text-right">
//                       {selected.candidates.id === -1
//                         ? selected.candidates.name
//                         : selected.candidates.lastName +
//                           ", " +
//                           selected.candidates.firstName +
//                           " " +
//                           (selected.candidates.middleName[0] === undefined
//                             ? ""
//                             : selected.candidates.middleName[0] + ". ") +
//                           " (" +
//                           selected.candidates.partylist.acronym +
//                           ")"}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ElectionVote;

const ElectionVote = () => {
  return <div>ElectionVote</div>;
};

export default ElectionVote;

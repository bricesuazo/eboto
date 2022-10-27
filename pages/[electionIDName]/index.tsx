// import React, { useContext, useState } from "react";
// import ButtonLink from "../../components/styled/ButtonLink";
// import ElectionContext from "../context/ElectionContext";

// const ElectionLanding = ({ election }) => {
//   const [readMore, setReadMore] = useState(false);
//   const { currentCandidates } = useContext(ElectionContext);

//   return (
//     <div>
//       <div className="bg-election-cover bg-no-repeat bg-center bg-cover h-48 w-full flex justify-center items-center">
//         {/* <div className="w-full h-full bg-black absolute top-0 left-0 inset-0 opacity-50"></div> */}
//       </div>
//       <div className="mx-2 md:mx-auto flex flex-col items-center text-center gap-y-4 py-8 max-w-3xl">
//         <div className="flex flex-col">
//           <span className="font-semibold text-2xl">{election?.name}</span>

//           <button
//             onClick={() => {
//               setReadMore(!readMore);
//             }}
//             className="text-sm text-gray-600"
//           >
//             {readMore ? election?.about : election?.about.slice(0, 79) + "..."}

//             <span className="font-semibold">
//               {!readMore ? " See more..." : " See less..."}
//             </span>
//           </button>
//         </div>

//         <div className="flex gap-x-4">
//           <ButtonLink to={`/${election?.electionIDName}/vote`}>Vote</ButtonLink>
//           <ButtonLink to={`/${election?.electionIDName}/realtime`}>
//             Realtime Count
//           </ButtonLink>
//         </div>

//         <div>
//           <span className="font-bold text-2xl">Candidates</span>
//           <div className="grid gap-8 mt-4 ">
//             {election?.positions.map((position) => {
//               return (
//                 <div key={position.id} className="flex flex-col gap-y-2">
//                   <span className="font-bold text-xl">{position.title}</span>
//                   <div className="grid grid-cols-1 sm:grid-flow-col-dense sm:grid-cols-none gap-2 place-items-center">
//                     {currentCandidates
//                       .filter(
//                         (filteredCandidate) =>
//                           filteredCandidate.position.id === position.id
//                       )
//                       .map((pos) => {
//                         return (
//                           <Link
//                             to={`./${pos.firstName
//                               .replaceAll(" ", "")
//                               .toLowerCase()}-${pos.lastName
//                               .replaceAll(" ", "")
//                               .toLowerCase()}`}
//                             key={pos.id}
//                             className="w-full h-full flex flex-col gap-y-2 rounded overflow-hidden border p-2 sm:max-w-xs hover:underline hover:text-primary hover:shadow-lg hover:border-2 transition-all"
//                           >
//                             <img
//                               src={pos.img}
//                               alt=""
//                               className="aspect-square h-full w-full rounded object-cover object-center"
//                             />
//                             <span className="font-bold">
//                               {pos.lastName}, {pos.firstName}{" "}
//                               {`${
//                                 pos.middleName.length !== 0
//                                   ? pos.middleName[0] + "."
//                                   : ""
//                               }`}{" "}
//                               ({pos.partylist.acronym})
//                             </span>
//                           </Link>
//                         );
//                       })}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//       {/* <span className="">{election?.about}</span> */}
//     </div>
//   );
// };

// export default ElectionLanding;

const ElectionLanding = () => {
  return <div>ElectionLanding</div>;
};

export default ElectionLanding;

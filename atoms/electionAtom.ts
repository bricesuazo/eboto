import { atom } from "recoil";

export const electionIdAtom = atom({ key: "electionIdState", default: "" });
export const electionAtom = atom({ key: "electionState", default: {} });

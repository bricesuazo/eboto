import DashboardPartylist from "@/components/client/pages/dashboard-partylist";
import {
  getAllPartylistsByElectionId,
  getElectionBySlug,
} from "@/utils/election";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Partylists",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await getElectionBySlug(electionDashboardSlug);
  const partylists = await getAllPartylistsByElectionId(election.id);
  return <DashboardPartylist election={election} partylists={partylists} />;
}

import type { Database } from './types';

type Election = Database['public']['Tables']['elections']['Row'];
type Position = Database['public']['Tables']['positions']['Row'];
type Candidate = Database['public']['Tables']['candidates']['Row'];

export type GeneratedElectionResult = {
  id: string;
  created_at: string;

  election: {
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    logo_url: string | null;
    name_arrangement: number;

    positions: {
      id: string;
      name: string;
      abstain_count: number;
      candidates: {
        id: string;
        first_name: string;
        middle_name: string | null;
        last_name: string;
        vote_count: number;
      }[];
    }[];
  };
};

import { TableAggregate } from '@convex-dev/aggregate';

import { components } from './_generated/api';
import type { DataModel, Id } from './_generated/dataModel';

/**
 * Per-election count of non-deleted voters. Maintained by voters.create /
 * bulkCreate / softDelete and (manually) by backfill. O(log n) reads.
 */
export const votersByElection = new TableAggregate<{
  Namespace: Id<'elections'>;
  Key: null;
  DataModel: DataModel;
  TableName: 'voters';
}>(components.votersByElection, {
  namespace: (doc) => doc.electionId,
  sortKey: () => null,
});

/**
 * Per-election count of voters that have cast a ballot. Membership is managed
 * by the cast mutation (first vote) and by voter softDelete (removed if voted).
 * Document mirrors the voter row.
 */
export const votedByElection = new TableAggregate<{
  Namespace: Id<'elections'>;
  Key: null;
  DataModel: DataModel;
  TableName: 'voters';
}>(components.votedByElection, {
  namespace: (doc) => doc.electionId,
  sortKey: () => null,
});

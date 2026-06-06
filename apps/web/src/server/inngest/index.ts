// Functions and the client now live in @eboto/inngest. This shim keeps the
// existing `~/server/inngest` import path working for the api route handler
// and the schedule-fn server function.
export {
  ELECTION_LIFECYCLE_EVENT,
  functions,
  inngest,
  scheduleElectionLifecycle,
  type ElectionLifecycleData,
} from '@eboto/inngest';

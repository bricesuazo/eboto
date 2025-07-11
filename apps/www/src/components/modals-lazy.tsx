import dynamic from 'next/dynamic';

// Lazy load heavy modal components to reduce initial bundle size
export const CreateElectionModalLazy = dynamic(
  () => import('./modals/create-election'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const CreateCandidateModalLazy = dynamic(
  () => import('./modals/create-candidate'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const EditCandidateModalLazy = dynamic(
  () => import('./modals/edit-candidate'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const CreateVoterModalLazy = dynamic(
  () => import('./modals/create-voter'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const UploadBulkVoterModalLazy = dynamic(
  () => import('./modals/upload-bulk-voter'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const ElectionBoostModalLazy = dynamic(
  () => import('./modals/election-boost'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);

export const MessageCommissionerModalLazy = dynamic(
  () => import('./modals/message-commissioner'),
  {
    ssr: false,
    loading: () => <div>Loading modal...</div>,
  }
);
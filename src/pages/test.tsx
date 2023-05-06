import UploadBulkVoter from "../components/modals/UploadBulkVoter";

const test = () => {
  return (
    <UploadBulkVoter
      isOpen={true}
      electionId={""}
      voterFields={[
        {
          id: "clhacy2lz0007vda4933gcc9b",
          name: "Section",
          createdAt: new Date("2023-05-05T09:32:32.566Z"),
          electionId: "clh8xcodf0000vdcw92krmqzz",
        },
      ]}
      onClose={() => {
        console.log("closed");
      }}
    />
  );
};

export default test;

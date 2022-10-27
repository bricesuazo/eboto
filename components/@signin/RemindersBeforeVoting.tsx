const RemindersBeforeVoting = () => {
  return (
    <div className="flex flex-col gap-y-4">
      <span className="text-4xl font-bold text-center">
        Reminders before voting
      </span>
      <ul className="flex flex-col gap-y-2">
        <li>Make sure that you are registered student of CvSU-Main, Indang.</li>
        <li>Use only your CvSU accounts, other accounts won&apos;t work.</li>
        <li>
          Fact check the credentials of the candidates you are planning to vote.
        </li>
        <li>Note that there will be only one vote per account.</li>
        <li>Prepare a list to ensure a quicker voting. </li>
        <li>Vote responsibly, it is you who have the power.</li>
      </ul>
    </div>
  );
};

export default RemindersBeforeVoting;

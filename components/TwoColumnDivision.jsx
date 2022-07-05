const TwoColumnDivision = ({ children }) => {
  return (
    <div className="flex h-screen w-full">
      <div className="hidden md:block bg-gray-500 flex-1">
        <div className="bg-election-cover bg-no-repeat bg-cover bg-center w-full h-full">
          <div className="w-full h-full bg-black bg-opacity-50">
            <span className="p-4 text-white grid place-items-center h-full">
              {children[0]}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full grid place-items-center z-10 mx-4 md:mx-8">
        {children[1]}
      </div>
    </div>
  );
};

export default TwoColumnDivision;

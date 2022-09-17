import Image from "next/image";

const PageNotFound = () => {
  return (
    <div className="h-screen grid place-items-center">
      <div className="flex flex-col items-center space-y-8">
        <div className="sm:w-[25rem] sm:h-[25rem] w-64 h-64 relative ">
          <Image
            src="https://img.freepik.com/free-vector/404-error-lost-space-concept-illustration_114360-7891.jpg?w=2000"
            alt=""
            className="mix-blend-multiply"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <span className="text-xl font-semibold">Page not found.</span>
      </div>
    </div>
  );
};

export default PageNotFound;

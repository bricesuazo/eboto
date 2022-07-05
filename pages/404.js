import Image from "next/image";

const PageNotFound = () => {
  return (
    <div className="h-screen grid place-items-center">
      <div className="relative flex flex-col items-center gap-y-4">
        <Image
          src="https://img.freepik.com/free-vector/404-error-lost-space-concept-illustration_114360-7891.jpg?w=2000"
          alt=""
          className="mix-blend-multiply"
          width={540}
          height={500}
          objectFit="cover"
          objectPosition="center"
        />
        <span className="text-xl font-semibold">Page not found.</span>
      </div>
    </div>
  );
};

export default PageNotFound;

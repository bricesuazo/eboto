const Button = ({ children, invert, bold, className, ...props }) => {
  return (
    <button
      className={`w-fit h-fit px-4 py-2 disabled:bg-gray-400 transition-all rounded-md select-none hover:opacity-75 ${className} ${
        !invert ? "bg-primary text-white" : "bg-white text-primary"
      } ${bold && "font-bold"}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

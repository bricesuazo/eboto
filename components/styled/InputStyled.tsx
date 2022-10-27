const InputStyled = ({ ...props }) => {
  return (
    <input
      className={`w-full outline-none p-2 bg-transparent border-gray-100 rounded-md focus:border-gray-500 border-2 transition-all select-none ${props.addedClassName}`}
      {...props}
    />
  );
};

export default InputStyled;

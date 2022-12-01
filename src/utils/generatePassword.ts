import generator from "generate-password";

const generatePassword = (length?: number) => {
  return generator.generate({
    length: length || 16,
    lowercase: true,
    uppercase: true,
  });
};

export default generatePassword;

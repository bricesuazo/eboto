import imageCompression from "browser-image-compression";

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};
const compress = async (file: File) => {
  return await imageCompression(file, options);
};

export default compress;

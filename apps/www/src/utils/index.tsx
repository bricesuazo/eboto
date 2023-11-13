export function transformUploadImage(
  file: File,
): Promise<{ name: string; type: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const base64 = reader.result as string;
      if (base64) {
        resolve({
          name: file.name,
          type: file.type,
          base64,
        });
      } else {
        reject("Failed to read file as base64.");
      }
    };

    reader.onerror = () => {
      reject("Error occurred while reading the file.");
    };
  });
}

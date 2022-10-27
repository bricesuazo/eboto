const capitalizeFirstLetterEachWord = (words: string) => {
  return words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
    letter.toUpperCase()
  );
};

export default capitalizeFirstLetterEachWord;

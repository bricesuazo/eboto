import { Box, Center, useRadio } from "@chakra-ui/react";

const CandidateCard = (props: any) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label" userSelect="none">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        _checked={{
          bg: "gray.600",
          color: "white",
          borderColor: "gray.600",
        }}
        px={4}
        py={2}
        width={48}
        height="64"
      >
        {props.children}
      </Box>
    </Box>
  );
};

export default CandidateCard;

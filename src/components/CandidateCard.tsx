import { Box, Stack, useRadio } from "@chakra-ui/react";

const CandidateCard = (props: any) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label" userSelect="none">
      <input {...input} style={{ display: "none" }} />
      <Stack
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
        justifyContent="center"
        alignItems="center"
        padding={[2, 4]}
        width={[40, 48]}
        height={[56, 64]}
      >
        {props.children}
      </Stack>
    </Box>
  );
};

export default CandidateCard;

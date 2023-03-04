import { Box, Stack } from "@mantine/core";

const VotingCandidate = ({
  children,
}: // ...props
{
  children: React.ReactNode;
}) => {
  // const { getInputProps, getCheckboxProps } = useRadio(props);

  // const input = getInputProps();
  // const checkbox = getCheckboxProps();
  return (
    <Box
    // as="label"
    // userSelect="none"
    >
      {/* <input {...input} style={{ display: "none" }} /> */}
      <Stack
      // {...checkbox}
      // cursor="pointer"
      // borderWidth="1px"
      // borderRadius="md"
      // boxShadow="md"
      // _checked={{
      //   bg: "gray.600",
      //   color: "white",
      //   borderColor: "gray.600",
      // }}
      // justify="center"
      // align="center"
      // padding={[2, 4]}
      // w={[40, 48]}
      // h={[56, 64]}
      >
        {children}
      </Stack>
    </Box>
  );
};

export default VotingCandidate;

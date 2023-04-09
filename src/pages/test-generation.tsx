import { Button } from "@mantine/core";
import { api } from "../utils/api";

const Test = () => {
  const generateMutation = api.election.generateResult.useMutation({
    onSuccess: (data) => {
      console.log(data);
    },
  });
  return (
    <div>
      <Button
        onClick={() => generateMutation.mutate()}
        loading={generateMutation.isLoading}
      >
        Generate
      </Button>
    </div>
  );
};

export default Test;

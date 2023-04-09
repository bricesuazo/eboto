// import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";

// const GenerateResult = dynamic(() => import("../pdf/GenerateResult"), {
//   ssr: false,
// });
import { supabase } from "../lib/supabase";
import GenerateResult, { type ResultType } from "../pdf/GenerateResult";

const uploadPdf = async ({
  result,
  path,
}: {
  result: ResultType;
  path: string;
}) => {
  await supabase.storage
    .from("eboto-mo")
    .upload(path, await pdf(<GenerateResult result={result} />).toBlob());

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};

export default uploadPdf;

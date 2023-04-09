import ReactPDF from "@react-pdf/renderer";
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
    .upload(
      path,
      await ReactPDF.pdf(<GenerateResult result={result} />).toBlob()
    );

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};

export default uploadPdf;

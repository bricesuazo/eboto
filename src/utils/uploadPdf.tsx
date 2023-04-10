import { supabase } from "../lib/supabase";
import GenerateResult, { type ResultType } from "../pdf/GenerateResult";
import ReactPDF from "@react-pdf/renderer";

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
      await ReactPDF.renderToStream(<GenerateResult result={result} />)
    );

  const {
    data: { publicUrl },
  } = supabase.storage.from("eboto-mo").getPublicUrl(path);

  return publicUrl;
};

export default uploadPdf;

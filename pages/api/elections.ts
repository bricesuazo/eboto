import type { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../utils/mongo";
import Elections from "../../models/Elections";

export default async function handler(req: NextRequest, res: NextResponse) {
  const { method } = req;
  dbConnect();

  switch (method) {
    case "GET":
      try {
        const allElections = await Elections.find();
        return res.status(200).json(allElections);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "POST":
      const independent = { title: "Independent", acronym: "IND" };
      try {
        const Election = await Elections.create({
          ...req.body,
          partylists: independent,
        });
        res.status(201).json(Election);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "PUT":
      try {
        const Election = await Elections.findByIdAndUpdate(
          req.body._id,
          req.body
        );
        res.status(200).json(Election);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "DELETE":
      try {
        const Election = await Elections.findByIdAndDelete(req.body._id);
        res.status(200).json(Election);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    default:
      return res.status(405).json({
        error: `Method ${method} not allowed`,
      });
  }
}

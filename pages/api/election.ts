import type { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../utils/mongo";
import Election from "../../models/Election";

export default async function handler(req: NextRequest, res: NextResponse) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case "GET":
      const electionIDName = req.query?.electionIDName;
      try {
        const selectedElections = await Election.findOne({ electionIDName });
        return res.status(200).json(selectedElections);
      } catch (err) {
        res.status(500).json(err.message);
      }
      break;
    case "POST":
      const independent = { title: "Independent", acronym: "IND" };
      try {
        const newElection = await Election.create({
          ...req.body,
          partylists: independent,
        });
        res.status(201).json(newElection);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "PUT":
      try {
        const updateElection = await Election.findByIdAndUpdate(
          req.body._id,
          req.body
        );
        res.status(200).json(updateElection);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "DELETE":
      try {
        const deleteElection = await Election.findByIdAndDelete(req.body._id);
        res.status(200).json(deleteElection);
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

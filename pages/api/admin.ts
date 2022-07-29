import bcrypt from "bcrypt";
import type { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../utils/mongo";
import Admin from "../../models/Admin";

export default async function handler(req: NextRequest, res: NextResponse) {
  const { method } = req;
  dbConnect();

  switch (method) {
    case "GET":
      try {
        const admin = await Admin.findOne({ email: req?.body?.email });

        const { password, ...others } = admin._doc;
        res.status(200).json({ others });
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "POST":
      try {
        const admin = await Admin.findOne({ email: req?.body?.email });
        if (admin) {
          res.status(409).json({ error: "Already registered" });
          return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(req?.body?.password, salt);
        const newAdmin = await Admin.create({
          ...req?.body,
          password: hashPass,
        });
        const { password, ...others } = newAdmin._doc;
        res.status(201).json(others);
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "PUT":
      try {
      } catch (err) {
        res.status(500).json(err);
      }
      break;
    case "DELETE":
      try {
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

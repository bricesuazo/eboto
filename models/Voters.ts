import mongoose from "mongoose";
import ElectionsSchema from "./Elections";

const VotersSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: "Elections" },
    // elections: { type: ElectionsSchema, required: true },
    hasVoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Voters || mongoose.model("Voters", VotersSchema);

import mongoose from "mongoose";

const VoterSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: "Election" },
    hasVoted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Voter", VoterSchema);
// export default mongoose.models.Voter || mongoose.model("Voter", VoterSchema);

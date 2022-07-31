import mongoose from "mongoose";

const ElectionSchema = new mongoose.Schema(
  {
    electionName: { type: String, required: true },
    electionIDName: { type: String, required: true, unique: true },
    about: { type: String, default: "" },
    startDate: { type: Date, default: "" },
    endDate: { type: Date, default: "" },
    positions: {
      type: [
        {
          title: { type: String, required: true },
          undecidedVotingCount: { type: Number, default: 0 },
        },
      ],
      _id: true,
    },
    partylists: {
      type: [
        {
          title: { type: String, required: true },
          acronym: { type: String, required: true },
        },
      ],
      _id: true,
    },
    candidates: {
      type: [
        {
          firstName: { type: String, required: true },
          middleName: { type: String },
          lastName: { type: String, required: true },
          description: String,
          img: { type: String },
          position: { type: mongoose.Schema.Types.ObjectId },
          election: { type: mongoose.Schema.Types.ObjectId, ref: "Election" },
          votingCount: { type: Number, default: 0 },
          significantAchievements: [String],
          leadershipAchievements: [String],
        },
      ],
      _id: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Election ||
  mongoose.model("Election", ElectionSchema);
// export default mongoose.models.Election ||
//   mongoose.model("Election", ElectionSchema);

import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    img: { type: String },
    elections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Elections" }],
    // elections: [{ type: ElectionsSchema, default: [] }],
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
// export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

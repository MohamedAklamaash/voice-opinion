import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, { timestamps: true });

friendshipSchema.index({ from: 1, to: 1 }, { unique: true });

export const FriendshipSchema = mongoose.model("friendships", friendshipSchema);

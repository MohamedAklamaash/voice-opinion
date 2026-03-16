import mongoose from "mongoose";

const loginSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique:true,
    },
    hashedOtp: {
        type: String,
        required: true,
    },
    expires: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000)
    }
}, {
    timestamps: true
})

export const UserloginSchema = mongoose.model("login", loginSchema);
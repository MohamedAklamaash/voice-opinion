import { Request, Response } from "express";
import { FriendshipSchema } from "../models/FriendshipModel";
import { UserSchema } from "../models/UserDataModel";

export const sendFriendRequest = async (req: Request, res: Response) => {
    const { from, to } = req.body;
    if (!from || !to || from === to)
        return res.status(400).json({ success: false, msg: "Invalid request" });

    const toUser = await UserSchema.findOne({ email: to, activated: true });
    if (!toUser) return res.status(404).json({ success: false, msg: "User not found" });

    const existing = await FriendshipSchema.findOne({
        $or: [{ from, to }, { from: to, to: from }],
    });
    if (existing) return res.status(409).json({ success: false, msg: "Request already exists" });

    await FriendshipSchema.create({ from, to });
    return res.status(201).json({ success: true, msg: "Friend request sent" });
};

export const respondToRequest = async (req: Request, res: Response) => {
    const { email, fromEmail, action } = req.body;
    if (!["accepted", "rejected"].includes(action))
        return res.status(400).json({ success: false, msg: "Invalid action" });

    const record = await FriendshipSchema.findOne({ from: fromEmail, to: email, status: "pending" });
    if (!record) return res.status(404).json({ success: false, msg: "Request not found" });

    record.status = action;
    await record.save();
    return res.status(200).json({ success: true });
};

export const getFriends = async (req: Request, res: Response) => {
    const { email } = req.params;
    const records = await FriendshipSchema.find({
        $or: [{ from: email }, { to: email }],
        status: "accepted",
    });
    const friendEmails = records.map(r => (r.from === email ? r.to : r.from));
    const friends = await UserSchema.find({ email: { $in: friendEmails } }, "name email userProfileUrl");
    return res.status(200).json({ success: true, data: friends });
};

export const getPendingRequests = async (req: Request, res: Response) => {
    const { email } = req.params;
    const records = await FriendshipSchema.find({ to: email, status: "pending" });
    const fromEmails = records.map(r => r.from);
    const users = await UserSchema.find({ email: { $in: fromEmails } }, "name email userProfileUrl");
    return res.status(200).json({ success: true, data: users });
};

export const getSentRequests = async (req: Request, res: Response) => {
    const { email } = req.params;
    const records = await FriendshipSchema.find({ from: email, status: "pending" });
    const toEmails = records.map(r => r.to);
    const users = await UserSchema.find({ email: { $in: toEmails } }, "name email userProfileUrl");
    return res.status(200).json({ success: true, data: users });
};

export const searchUsers = async (req: Request, res: Response) => {
    const { q, email } = req.query as { q: string; email: string };
    if (!q || q.length < 2) return res.status(200).json({ success: true, data: [] });
    const users = await UserSchema.find(
        { name: { $regex: q, $options: "i" }, activated: true, email: { $ne: email } },
        "name email userProfileUrl"
    ).limit(10);
    return res.status(200).json({ success: true, data: users });
};

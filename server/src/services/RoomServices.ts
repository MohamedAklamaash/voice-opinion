import { RoomSchema } from "../models/RoomModal"
import { Request, Response } from "express";
import { UserSchema } from "../models/UserDataModel";

export const joinRoom = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { roomId } = req.params;
        if (!email) {
            return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
        }
        const roomData = await RoomSchema.findById(roomId);
        if (!roomData) {
            return res.status(404).json({ success: false, msg: "No such Room exists" });
        }
        const userData = await UserSchema.findOne({ email });
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User doesn't exist" });
        }
        if (!roomData.speakers.includes(userData.name)) {
            // For non-public rooms, check invite list
            if (roomData.roomType !== "public" && roomData.owner !== userData.name) {
                if (!roomData.invitedEmails.includes(email)) {
                    return res.status(403).json({ success: false, msg: "You need an invite to join this room" });
                }
                // Remove from invite list after joining
                await roomData.updateOne({ $pull: { invitedEmails: email } });
            }
            await roomData.updateOne({ $push: { speakers: userData.name } });
            await roomData.save();
            return res.status(201).json({ success: true, msg: "User joined Room successfully", userData });
        }
        else {
            return res.status(301).json({ success: false, msg: "User already exists in the Room" });
        }
    } catch (error) {
        console.log("Error in Joining the Room");
    }
}

export const leaveARoom = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { roomId } = req.params;
        if (!email) {
            return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
        }
        const roomData = await RoomSchema.findById(roomId);
        if (!roomData) {
            return res.status(404).json({ success: false, msg: "No such Room exists" });
        }
        const userData = await UserSchema.findOne({ email });
        if (!userData) {
            return res.status(404).json({ success: false, msg: "User doesn't exist" });
        }
        if (roomData.speakers.includes(userData.name)) {
            await roomData.updateOne({ $pull: { speakers: userData.name } });
            await roomData.save();
            return res.status(201).json({ success: true, msg: "User Left Room successfully", userData });
        }
        else {
            return res.status(301).json({ success: false, msg: "User doesn't exist in the Room" });
        }
    } catch (error) {
        console.log("Error in leaving the room");
    }
}
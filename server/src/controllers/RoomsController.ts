import { RoomSchema } from "../models/RoomModal"
import { Request, Response } from "express";
import { UserSchema } from "../models/UserDataModel";
import { FriendshipSchema } from "../models/FriendshipModel";
import { io } from "../index";
import { sendRoomInviteEmail } from "../services/EmailService";

export const createARoom = async (req: Request, res: Response) => {
    try {
        const { email, title, roomType, inviteEmails } = req.body;
        if (!email || !title || !roomType) {
            return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
        }
        const owner = await UserSchema.findOne({ email });
        if (!owner) {
            return res.status(404).json({ success: false, msg: "Email's user not Found" });
        }

        // For social rooms, invited emails come from the friends list selection
        const emailsToInvite: string[] = roomType !== "public" && Array.isArray(inviteEmails) ? inviteEmails : [];

        const data = await RoomSchema.create({
            title,
            owner: owner.name,
            ownerEmail: email,
            roomType,
            speakers: [owner.name],
            invitedEmails: emailsToInvite,
        });

        if (roomType === "public") io.emit("new-room", data);

        // Fire-and-forget invite emails — don't block room creation
        if (emailsToInvite.length > 0) {
            Promise.allSettled(
                emailsToInvite.map(inviteEmail =>
                    sendRoomInviteEmail(inviteEmail, title, String(data._id), owner.name)
                )
            ).then(results => {
                results.forEach((r, i) => {
                    if (r.status === "rejected") console.error(`[createARoom] email failed for ${emailsToInvite[i]}:`, r.reason);
                });
            });
        }

        return res.status(200).json({ success: true, msg: "Room created successfully", data });
    } catch (error) {
        console.log("Error in creating the room", error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
}

type User = {
    name?: string;
    activated?: boolean;
    email?: string;
    phoneNumber?: string;
    userProfileUrl?: string;
}

export const getRoomDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await RoomSchema.findById(id);
        if (!data) return res.status(404).json({ success: false, msg: "No room found" });

        let userData: Array<User> = [];
        await Promise.all(data.speakers.map(async (name) => {
            const user = await UserSchema.findOne({ name });
            if (user != null) userData.push(user as any);
        }));

        return res.status(201).json({ success: true, data, userData });
    } catch (error) {
        console.log("Error in getting room details", error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
}

export const getAllRooms = async (req: Request, res: Response) => {
    try {
        const data = await RoomSchema.find({ roomType: "public" });
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, msg: "No public rooms exist" });
        }
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.log("Error in getting all rooms");
    }
}

export const deleteARoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await RoomSchema.findByIdAndDelete(id);
        if (!data) return res.status(404).json({ success: false, msg: "No room found with this id" });
        return res.status(200).json({ success: true, msg: "Room deleted successfully" });
    } catch (error) {
        console.log("Error in deleting the room");
    }
}

export const inviteToRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ownerEmail, inviteEmail } = req.body;
        const owner = await UserSchema.findOne({ email: ownerEmail });
        const room = await RoomSchema.findById(id);
        if (!room || !owner) return res.status(404).json({ success: false, msg: "Room or owner not found" });
        if (room.owner !== owner.name) return res.status(403).json({ success: false, msg: "Only owner can invite" });

        if (!room.invitedEmails.includes(inviteEmail)) {
            await room.updateOne({ $push: { invitedEmails: inviteEmail } });
        }

        try {
            // Fire-and-forget — respond immediately, email sends in background
            sendRoomInviteEmail(inviteEmail, room.title, id, owner.name)
                .then(() => console.log(`[invite] email sent to ${inviteEmail}`))
                .catch(err => console.error(`[invite] email failed for ${inviteEmail}:`, err.message));
        } catch (_) {}

        return res.status(200).json({ success: true, msg: "Invited successfully" });
    } catch (error) {
        console.error("[inviteToRoom] error:", error);
        return res.status(500).json({ success: false });
    }
};

export const getPendingInvites = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const rooms = await RoomSchema.find({ invitedEmails: email });
        return res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const getSocialRooms = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const friendships = await FriendshipSchema.find({
            $or: [{ from: email }, { to: email }],
            status: "accepted",
        });
        const friendEmails = friendships.map(f => (f.from === email ? f.to : f.from));
        const rooms = await RoomSchema.find({
            roomType: "social",
            $or: [{ ownerEmail: email }, { ownerEmail: { $in: friendEmails } }],
        });
        return res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

// GET /room/myRooms/:email — rooms the user was invited to (pending or accepted)
export const getMyInvitedRooms = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const rooms = await RoomSchema.find({
            $or: [{ invitedEmails: email }, { acceptedEmails: email }],
        }, "_id title owner roomType");
        return res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

// DELETE /room/leaveInvite/:id  — user removes themselves from invite lists
export const leaveInvite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        await RoomSchema.findByIdAndUpdate(id, {
            $pull: { invitedEmails: email, acceptedEmails: email },
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

export const updateRoom = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { id } = req.params;
        const userData = await UserSchema.findOne({ email });
        const roomData = await RoomSchema.findById(id);

        if (roomData?.owner === userData?.name) {
            if (roomData) {
                roomData.updateOne({ $set: req.body });
                await roomData.save();
                return res.status(201).json({ success: true, roomData });
            }
        } else {
            return res.status(401).json({ success: false, msg: "Cannot update because this user is not the owner of this room" });
        }
    } catch (error) {
        console.log("Error in updating the room:", error);
        return res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};

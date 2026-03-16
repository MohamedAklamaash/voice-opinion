import { RoomSchema } from "../models/RoomModal"
import { Request, Response } from "express";
import { UserSchema } from "../models/UserDataModel";
import { io } from "../index";

//create a room,join a room,owner can update the room details,delete the room,get room details

export const createARoom = async (req: Request, res: Response) => {
    try {
        const { email, title, roomType } = req.body;
        if (!email || !title || !roomType) {
            return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
        }
        const owner = await UserSchema.findOne({ email });
        if (!owner) {
            return res.status(404).json({ success: false, msg: "Email's user not Found", owner })
        }
        const data = await RoomSchema.create({
            title, owner: owner?.name, roomType, speakers: [owner?.name]
        });
        if (roomType === "public") io.emit("new-room", data);
        return res.status(200).json({ success: true, msg: "Room created successfully", data });
    } catch (error) {
        console.log("Error in creating the room");
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

        if (!data) {
            return res.status(404).json({ success: false, msg: "No room found" });
        }

        let userData: Array<User> = [];

        await Promise.all(data.speakers.map(async (name) => {
            const user = await UserSchema.findOne({ name });
            // the users that aren't activated will be null
            if(user!=null){
                userData.push(user as any);
            }
        }));

        return res.status(201).json({ success: true, data, userData });
    } catch (error) {
        console.log("Error in getting room details", error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
}
//need to show only public rooms
export const getAllRooms = async (req: Request, res: Response) => {
    try {
        const data = await RoomSchema.find({ roomType: "public" });
        if (!data) {
            return res.status(404).json({ success: false, msg: "No room exists" });
        }
        if (data.length === 0) {
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
        if (!data) {
            return res.status(404).json({ success: false, msg: "No room found with this id" });
        }
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
        return res.status(200).json({ success: true, msg: "Invited successfully" });
    } catch (error) {
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

export const updateRoom = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const { id } = req.params;
        const userData = await UserSchema.findOne({ email });
        const roomData = await RoomSchema.findById(id);

        if (roomData?.owner === userData?.name) {
            // Check if roomData is not null before updating
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

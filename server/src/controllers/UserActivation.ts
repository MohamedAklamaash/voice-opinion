import { UserSchema } from "../models/UserDataModel";
import { Request, Response } from "express";

export const checkNameAvailable = async (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ success: false, msg: "Name required" });
    const existing = await UserSchema.findOne({ name });
    // Available if no one has it, or the same email already owns it
    const available = !existing || existing.email === email;
    return res.status(200).json({ available });
};

export const activateUser = async (req: Request, res: Response) => {
    const { name, email, userProfileUrl } = req.body;
    if (!name || !email) {
        return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
    }

    try {
        // Reject if name is taken by a different user
        const nameTaken = await UserSchema.findOne({ name, email: { $ne: email } });
        if (nameTaken) {
            return res.status(409).json({ success: false, msg: "Username already taken" });
        }

        let user = await UserSchema.findOne({ email });
        if (!user) {
            user = await UserSchema.create({ name, email, activated: true, userProfileUrl });
            return res.status(201).json({ success: true, msg: "User created and activated successfully" });
        }

        user.activated = true;
        user.name = name;
        user.userProfileUrl = userProfileUrl;
        await user.save();

        return res.status(200).json({ success: true, msg: "User activated successfully" });
    } catch (error) {
        console.error("Error activating user:", error);
        return res.status(500).json({ success: false, msg: "Internal server error" });
    }
};


export const deactivateUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(404).json({ success: false, msg: "Need data for resource authorization" });
        }
        const data = await UserSchema.findOne({ email });
        if (!data) {
            return res.status(201).json({ success: false, msg: "User not Found" })
        }

        data.activated = false;
        await data.save();
        return res.status(201).json({ success: true, msg: "User deactivated Successfully" });
    } catch (error) {
        console.log("error in deactivating the user");
    }
}

export const isUserActivated =async (req:Request,res:Response) => {
    try {
        const {email} = req.body;
        const data = await UserSchema.findOne({email});
        if(!data?.activated){
            return res.status(404).json({success:false})
        }
        return res.status(201).json({success:true});
    } catch (error) {
        
    }
}
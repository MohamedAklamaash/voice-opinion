import mongoose from "mongoose";

const roomModal = new mongoose.Schema({
    owner:{
        type:String,
        required:true
    },
    speakers:{
        type:[String],
        default:[],
    },
    title:{
        type:String,
        required:true,
    },
    roomType:{
        type:String,
        required:true,
        enum:["social","public","private"]
    },
    invitedEmails:{
        type:[String],
        default:[],
    }
})

export const RoomSchema = mongoose.model("rooms",roomModal);
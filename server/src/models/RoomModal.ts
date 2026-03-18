import mongoose from "mongoose";

const roomModal = new mongoose.Schema({
    owner:{
        type:String,
        required:true
    },
    ownerEmail:{
        type:String,
        default:"",
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
    },
    acceptedEmails:{
        type:[String],
        default:[],
    }
})

export const RoomSchema = mongoose.model("rooms",roomModal);

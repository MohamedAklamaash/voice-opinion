import mongoose from "mongoose";

const UserModel = new mongoose.Schema({
    name:{
        type:String,
        default:""
    },
    activated:{
        type:Boolean,
        default:false
    },
    email:{
        type:String,
        default:"",
        unique:true,
    },
    phoneNumber:{
        type:String,
        default:""
    },
    userProfileUrl:{
        type:String,
        default:""
    }
})

export const UserSchema = mongoose.model("userActivation",UserModel);
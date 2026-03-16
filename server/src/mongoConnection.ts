import mongoose from "mongoose";

export const mongoConnection = async () => {
    await mongoose.connect(`${process.env.MONGO_URL}`).then(() => {
        console.log("Mongo DB is connected successfully!");
    }).catch((err) => {
        console.log("Error in connecting to Mongo DB");
    })
}
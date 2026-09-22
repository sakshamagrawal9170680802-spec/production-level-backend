import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

async function connectDB(){
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}/?appName=Cluster0`)//connectionInstance contains resolve result 
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    }
    catch(error){//here error contains reject result
        console.log("MongoDB connection error: ",error);
        process.exit(1)
    }
}

export default connectDB
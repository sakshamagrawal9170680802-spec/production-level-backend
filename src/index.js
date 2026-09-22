//require("dotenv").config({path: './env'})
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()













//ASYNC AWAIT APPROACH
// import express from "express"

// const app=express()
// ;(async function(){
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}/?appName=Cluster0`)//it tells mongoose to connect to database and it returns resolve result
//        app.on("error",(error)=>{
//         console.log("ERROR: ",error);
//         throw error
//        })//now this app.on is dealing with completely different type of error the error that cames when our app is not able to use express

//        app.listen(process.env.PORT,()=>{
//         console.log("App is listening on port: ",process.env.PORT);
        
//        })
//     }
//     catch(error){//error contains reject result
//         console.error("ERROR: ",error)
//         throw error//it means "Stop normal execution here and send this error to the surrounding error-handling mechanism."
//     }
// })()//it is IIFE function usually a function is defined and then run afterwards but iife make that defined function to run automatically


//2. Why don't we use await with app.on()?

// Look at:

// app.on("error", (error) => {
//     console.log("ERROR:", error);
// });

// app.on() is not an asynchronous operation that returns a Promise that you wait for.

// It is registering an event listener.

// You're basically saying:

// "Express, if an error event happens in the future, run this function."

// You're not asking Express:

// "Do this operation and give me a result."

// You're saying:

// WHEN error happens
//         ↓
// run this callback

// So there is nothing to:

// await






//PROMISE,THEN,CATCH APPROACH
// mongoose
//     .connect(`${process.env.MONGODB_URI}/${DB_NAME}/?appName=Cluster0`)
//     .then(() => {//here in argument you could have given resolve result of above promise like in catch error is reject result of above promise

//         console.log("MongoDB connected successfully");

//         app.on("error", (error) => {
//             console.log("ERROR:", error);
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log(
//                 "App is listening on port:",
//                 process.env.PORT
//             );
//         });

//     })
//     .catch((error) => {

//         console.error("ERROR:", error);
//         throw error;

//     });
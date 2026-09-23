//require("dotenv").config({path: './env'})
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import dotenv from "dotenv"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { log } from "console";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR: ",error);
        throw error
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed !!!: ",error);
    
})//now to understand it read chat gpt response from line 132 MUST READ IT
//TO UNDERSATND DEEPLY ABOUT THROW ERROR IN CONNECTDB AND HERE HOW IT IS RELATED TO CATCH SEE LINE 267













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



//CHATGPT RESPONSE STARTS FOR PROMISE ASYNC FUNCTION
// Almost — **the first part is correct, but the second needs one correction.**

// For an `async` function:

// ### Successful completion

// If you:

// ```js
// const connectDB = async () => {
//     try {
//         return "success";
//     } catch (error) {
//         // ...
//     }
// };
// ```

// then:

// ```js
// connectDB().then((value) => {
//     console.log(value);
// });
// ```

// gets:

// ```text
// success
// ```

// So yes:

// ```js
// return value;
// ```

// acts like:

// ```js
// resolve(value);
// ```

// ---

// ### Failure

// For rejection, **`return` does NOT mean reject**.

// You need to **throw** an error:

// ```js
// const connectDB = async () => {
//     try {
//         return "success";
//     } catch (error) {
//         throw error;
//     }
// };
// ```

// The:

// ```js
// throw error;
// ```

// acts like:

// ```js
// reject(error);
// ```

// So the mental model is:

// ```text
// async function
//       │
//       ├── return value ──→ resolve(value) ──→ .then()
//       │
//       └── throw error ──→ reject(error) ──→ .catch()
// ```

// ### Example

// ```js
// const test = async () => {
//     try {
//         const x = 10;

//         if (x === 10) {
//             return "Everything worked";
//         }

//         throw new Error("Something went wrong");

//     } catch (error) {
//         throw error;
//     }
// };

// test()
//     .then((value) => {
//         console.log("THEN:", value);
//     })
//     .catch((error) => {
//         console.log("CATCH:", error);
//     });
// ```

// If the `return` executes:

// ```text
// THEN: Everything worked
// ```

// If the `throw` executes:

// ```text
// CATCH: Error: Something went wrong
// ```

// So remember just this:

// > **`return` from an async function → fulfilled Promise → `.then()`**
// > **`throw` from an async function → rejected Promise → `.catch()`**

// And if an `await`ed Promise rejects, that rejection also causes the `async` function to reject **unless you catch and handle it yourself**.




// Yes — this is a subtle but **very important distinction**. The two situations are actually consistent.

// The key question is:

// > **Where does the error occur, and has it already been caught?**

// ---

// ## 1. In `getUser()`, the error is produced by `await`

// Consider:

// ```js
// const getUser = async (req, res) => {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     res.json(user);
// };
// ```

// There are actually **two different possible errors** here.

// ### Case A: `User.findById()` fails

// ```js
// const user = await User.findById(req.params.id);
// ```

// Suppose `User.findById()` returns a rejected Promise:

// ```text
// User.findById()
//       ↓
//   Promise rejects
//       ↓
//      await
//       ↓
// throws the rejection reason
// ```

// You **do not need another `throw`**.

// Because `await` automatically turns a rejected Promise into a thrown error inside the async function.

// So:

// ```js
// const user = await User.findById(...);
// ```

// is effectively:

// ```text
// Promise rejected
//       ↓
// await
//       ↓
// error thrown inside getUser()
//       ↓
// getUser() Promise becomes rejected
// ```

// Then `asyncHandler` catches that rejection.

// ---

// ### Case B: User doesn't exist

// This is different:

// ```js
// if (!user) {
//     throw new ApiError(404, "User not found");
// }
// ```

// Here **you are manually creating the error**.

// `User.findById()` didn't necessarily fail. It may have successfully returned:

// ```js
// null
// ```

// So you deliberately do:

// ```js
// throw new ApiError(...)
// ```

// which causes:

// ```text
// throw
//  ↓
// getUser() Promise becomes rejected
//  ↓
// asyncHandler .catch()
// ```

// ---

// # 2. Now let's revisit your `connectDB`

// You had something like:

// ```js
// const connectDB = async () => {
//     try {
//         const connectionInstance = await mongoose.connect(
//             `${process.env.MONGODB_URI}/${DB_NAME}?appName=Cluster0`
//         );

//         console.log("MongoDB connected");
//     } catch (error) {
//         console.log("MONGODB connection error:", error);
//         process.exit(1);
//     }
// };
// ```

// The important part is:

// ```js
// catch (error) {
//     console.log(...);
//     process.exit(1);
// }
// ```

// Here the error from:

// ```js
// await mongoose.connect(...)
// ```

// **is already caught by this `catch`.**

// So the error doesn't automatically reach an **outer** `.catch()`.

// ---

// # 3. Imagine an outer catch

// Suppose you do:

// ```js
// connectDB().catch((error) => {
//     console.log("OUTER CATCH:", error);
// });
// ```

// You might think:

// ```text
// mongoose.connect()
//        ↓
// rejects
//        ↓
// inner catch
//        ↓
// outer catch
// ```

// But that's not what happens with:

// ```js
// catch (error) {
//     console.log(error);
//     process.exit(1);
// }
// ```

// The inner `catch` has already handled the rejection.

// And then:

// ```js
// process.exit(1);
// ```

// terminates the Node process.

// ---

// # 4. What if we DON'T use `process.exit()`?

// Consider:

// ```js
// const connectDB = async () => {

//     try {

//         await mongoose.connect(...);

//     } catch (error) {

//         console.log("Database error:", error);

//     }
// };
// ```

// Now:

// ```js
// connectDB().catch((error) => {
//     console.log("OUTER CATCH:", error);
// });
// ```

// Will the outer catch run?

// **No.**

// Why?

// Because the inner:

// ```js
// catch (error)
// ```

// caught the rejection and then the function reaches the end.

// An `async` function that reaches the end without returning/throwing fulfills its Promise with:

// ```js
// undefined
// ```

// So:

// ```text
// mongoose.connect()
//        ↓
// rejects
//        ↓
// inner catch catches it
//        ↓
// console.log()
//        ↓
// function finishes
//        ↓
// connectDB() fulfills with undefined
//        ↓
// outer .catch() does NOT run
// ```

// ---

// # 5. If you want the outer catch to receive it

// You need to **rethrow** it:

// ```js
// const connectDB = async () => {

//     try {

//         await mongoose.connect(...);

//     } catch (error) {

//         console.log("Database error:", error);

//         throw error;
//     }
// };
// ```

// Now:

// ```js
// connectDB().catch((error) => {
//     console.log("OUTER CATCH:", error);
// });
// ```

// works.

// The flow is:

// ```text
// mongoose.connect()
//        ↓
// rejects
//        ↓
// inner catch(error)
//        ↓
// console.log(error)
//        ↓
// throw error
//        ↓
// connectDB() becomes rejected
//        ↓
// outer .catch(error)
//        ↓
// receives error
// ```

// ---

// # 6. This gives you the rule

// There are **three situations** to distinguish.

// ### Situation 1 — Awaited Promise rejects

// ```js
// const getUsers = async () => {
//     const users = await User.find();
// };
// ```

// If `User.find()` rejects:

// ```text
// User.find() rejects
//       ↓
// await throws
//       ↓
// getUsers() rejects
// ```

// **No explicit `throw` is necessary.**

// ---

// ### Situation 2 — You want to create your own error

// ```js
// const getUsers = async () => {

//     const user = await User.findById(id);

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }
// };
// ```

// Here you **must explicitly throw** because you're creating a new error condition yourself.

// ---

// ### Situation 3 — You caught an error but want another layer to receive it

// ```js
// const connectDB = async () => {

//     try {
//         await mongoose.connect(...);

//     } catch (error) {

//         console.log(error);

//         throw error;  // rethrow
//     }
// };
// ```

// Here you **must explicitly `throw` again** because your inner `catch` has already intercepted the error.

// ---

// # 7. This is the distinction that was causing the confusion

// You were thinking:

// > "For an error to reach `.catch()`, I always have to write `throw error`."

// That's **not true**.

// Instead:

// ### Rejected Promise automatically propagates if nobody catches it.

// ```text
// Promise rejects
//       ↓
// await
//       ↓
// throws inside async function
//       ↓
// async function Promise rejects
//       ↓
// outer .catch() receives it
// ```

// But:

// ### Once you catch it, you've intercepted it.

// ```text
// Promise rejects
//       ↓
// try/catch
//       ↓
// catch(error)
//       ↓
//       ├── don't throw → error stops here
//       │
//       └── throw error → error continues upward
// ```

// That's the key concept.

// ---

// ## A very simple analogy

// Think of an error as a package being passed upward:

// ```text
// Database
//    ↓
// getUser()
//    ↓
// asyncHandler
//    ↓
// Express error middleware
// ```

// If nobody opens the package:

// ```text
// error
//  ↓
// continues upward automatically
// ```

// If `getUser()` catches it:

// ```js
// catch(error) {
//     // opened the package
// }
// ```

// then the error stops there **unless you say**:

// ```js
// throw error;
// ```

// which means:

// > "I handled/logged it here, but I still want the next layer to know about it."

// So the earlier `connectDB` explanation was specifically about **rethrowing an error after an inner `catch`**, whereas the `getUser` example involves an error that is **never caught inside `getUser` in the first place**.

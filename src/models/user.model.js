import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema=new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,// cloudinary url
            required: true
        },
        coverImage: {
            type: String//cloudinary url
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true,"Password is required"]
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)


userSchema.pre("save",async function(next){//here next is passed similar to middelwares of express but it is mongoose middleware not express to properly understand it see chatgpt response down at line 87
    if(this.isModified("password")){//here isModified is a mongoose document method
        this.password=await bcrypt.hash(this.password,10)
    }
    //next()//if something fails next(error) will be received by monggose and if succes only next()
})//DO NOT USE ARROW FUNCTION AS IT DOES NOT HAVE CONTEXT OF THIS it is a mongoose midleware or hook pre says before user document is saved run this function

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}//this is a way to create a method later if user1 is created with userSchema it can directly use user1.isPasswordCorrect(password)

userSchema.methods.generateAccessToken=function(){    
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshToken=function(){    
    return jwt.sign({
        _id: this._id,
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}//to understand access token and refresh token see chatgpt response on line 800

export const User=mongoose.model("User",userSchema)



// Exactly the right question. The confusion comes from mixing **Express middleware** and **Mongoose middleware**. They both use the word "middleware", but they are different systems.

// Let's separate them.

// ---

// # 1. This is NOT Express middleware

// Your code:

// ```js
// userSchema.pre("save", async function(next) {

//     if (this.isModified("password")) {
//         this.password = bcrypt.hash(this.password, 10)
//     }

//     next()
// })
// ```

// is **Mongoose middleware**, specifically **document middleware for the `save` operation**.

// It is not something like:

// ```js
// app.use((req, res, next) => {})
// ```

// which is Express middleware.

// Therefore, Mongoose does **not** give this function:

// ```js
// req
// res
// next
// ```

// It gives it arguments according to the particular Mongoose middleware type.

// ---

// # 2. Compare Express vs Mongoose middleware

// ### Express

// You have:

// ```js
// app.use((req, res, next) => {
//     // ...
// });
// ```

// Express is dealing with an **HTTP request**.

// Therefore it gives you:

// ```text
// req → HTTP request
// res → HTTP response
// next → next Express middleware
// ```

// So:

// ```js
// (req, res, next)
// ```

// makes sense.

// ---

// ### Mongoose

// Your code is:

// ```js
// userSchema.pre("save", async function(next) {
//     // ...
// });
// ```

// Mongoose isn't dealing directly with an HTTP request here.

// It's dealing with:

// ```text
// Document
//    ↓
// save()
// ```

// So Mongoose's middleware system doesn't need:

// ```text
// req
// res
// ```

// because there may not even be an HTTP request.

// You could call:

// ```js
// user.save();
// ```

// from a script, a background job, a test, a CLI program, etc.

// There might be **no `req` or `res` at all**.

// ---

// # 3. So what is `next` doing here?

// This:

// ```js
// next()
// ```

// is **Mongoose's middleware continuation function**.

// It means:

// > "My pre-save middleware has finished. Continue with the save operation."

// The flow is approximately:

// ```text
// user.save()
//     ↓
// Mongoose pre("save")
//     ↓
// your function
//     ↓
// next()
//     ↓
// Mongoose continues
//     ↓
// save document to MongoDB
// ```

// This `next` has a similar *idea* to Express's `next`, but it belongs to **Mongoose's middleware system**.

// ---

// # 4. But you said it's an `async` function — shouldn't it have `try/catch`?

// No.

// This is the important part.

// An `async` function **does not automatically require**:

// ```js
// try {
    
// } catch(error) {

// }
// ```

// Remember what `async` means:

// > An async function returns a Promise, and if an uncaught error occurs inside it, its Promise becomes rejected.

// For example:

// ```js
// const test = async () => {

//     throw new Error("Something went wrong");

// };
// ```

// There is no `try/catch`.

// But:

// ```js
// test()
// ```

// still produces a rejected Promise.

// So `async` does **not** mean:

// ```text
// async → must have try/catch
// ```

// It means:

// ```text
// async → function works with Promises
// ```

// ---

// # 5. What happens if bcrypt fails?

// Suppose you write:

// ```js
// userSchema.pre("save", async function(next) {

//     this.password = await bcrypt.hash(this.password, 10);

//     next();
// });
// ```

// Imagine:

// ```js
// bcrypt.hash(...)
// ```

// rejects.

// Because you're using:

// ```js
// await bcrypt.hash(...)
// ```

// the rejection becomes a thrown error inside this async function.

// Conceptually:

// ```text
// bcrypt.hash()
//       ↓
// Promise rejects
//       ↓
// await
//       ↓
// error thrown inside pre middleware
//       ↓
// async function's Promise rejects
//       ↓
// Mongoose knows middleware failed
// ```

// You don't necessarily need:

// ```js
// try/catch
// ```

// just to make Mongoose aware of the failure.

// ---

// # 6. This is similar to what we discussed with `getUser()`

// Remember:

// ```js
// const getUser = async () => {

//     const user = await User.findById(id);

//     res.json(user);
// };
// ```

// If:

// ```js
// User.findById()
// ```

// rejects:

// ```text
// User.findById()
//       ↓
// rejects
//       ↓
// await throws
//       ↓
// getUser() Promise rejects
//       ↓
// asyncHandler catches it
// ```

// Same general principle here:

// ```text
// bcrypt.hash()
//       ↓
// rejects
//       ↓
// await throws
//       ↓
// middleware Promise rejects
//       ↓
// Mongoose handles middleware failure
// ```

// ---

// # 7. But your current code has an important bug

// You currently have:

// ```js
// this.password = bcrypt.hash(this.password, 10)
// ```

// You aren't using `await`.

// That's a problem.

// `bcrypt.hash()` returns a Promise.

// So you're effectively doing:

// ```js
// this.password = Promise
// ```

// rather than:

// ```js
// this.password = actualHashedPassword
// ```

// You should write:

// ```js
// userSchema.pre("save", async function(next) {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

//     next();
// });
// ```

// Now the sequence is:

// ```text
// this.password
//       ↓
// bcrypt.hash()
//       ↓
// Promise
//       ↓
// await
//       ↓
// hashed password
//       ↓
// this.password = hashed password
//       ↓
// next()
// ```

// ---

// # 8. Do you need `try/catch` here?

// You **can** write it:

// ```js
// userSchema.pre("save", async function(next) {

//     try {

//         if (this.isModified("password")) {
//             this.password = await bcrypt.hash(this.password, 10);
//         }

//         next();

//     } catch (error) {

//         next(error);

//     }

// });
// ```

// This is valid.

// Here:

// ```js
// next()
// ```

// means:

// > "Continue."

// And:

// ```js
// next(error)
// ```

// means:

// > "Stop the middleware chain; something went wrong."

// Mongoose will receive that error and the save operation will fail.

// ---

// # 9. But there's an even cleaner async version

// Because this middleware is already `async`, you can let the Promise determine success/failure:

// ```js
// userSchema.pre("save", async function() {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

// });
// ```

// Notice:

// ```js
// function()
// ```

// There is no `next`.

// Why?

// Because an async function itself gives Mongoose a Promise.

// Conceptually:

// ### Success

// ```text
// async middleware
//       ↓
// Promise fulfills
//       ↓
// Mongoose continues save
// ```

// ### Failure

// ```text
// async middleware
//       ↓
// Promise rejects
//       ↓
// Mongoose knows middleware failed
//       ↓
// save fails
// ```

// So you don't need to manually call `next()`.

// ---

// # 10. Don't mix the two styles unnecessarily

// You have two approaches.

// ### Callback style

// ```js
// userSchema.pre("save", function(next) {

//     try {
//         // work
//         next();
//     } catch (error) {
//         next(error);
//     }

// });
// ```

// Here `next` controls completion/error.

// ---

// ### Promise/async style

// ```js
// userSchema.pre("save", async function() {

//     await something();

// });
// ```

// Here the Promise controls completion/error.

// ```text
// resolve → success
// reject  → error
// ```

// For modern async code, the second style is usually easier to understand.

// ---

// # 11. One subtle point: `next` isn't "the next middleware" in exactly the same sense as Express

// In Express:

// ```js
// next()
// ```

// means roughly:

// > Go to the next middleware/route handler in the HTTP pipeline.

// In Mongoose:

// ```js
// next()
// ```

// means roughly:

// > This Mongoose middleware has completed; continue the Mongoose operation/middleware chain.

// So although they look similar:

// ```js
// Express:  next()
// Mongoose: next()
// ```

// they belong to **different middleware systems**.

// ---

// # 12. Why does Mongoose need middleware at all?

// This is the bigger concept behind your password example.

// You want:

// ```js
// const user = new User({
//     username: "abc",
//     password: "hello123"
// });

// await user.save();
// ```

// to automatically become:

// ```text
// user.save()
//     ↓
// Mongoose pre-save middleware
//     ↓
// is password modified?
//     ↓
// YES
//     ↓
// bcrypt.hash()
//     ↓
// replace plaintext password with hash
//     ↓
// continue save
//     ↓
// MongoDB
// ```

// So your controller doesn't need to remember:

// ```js
// user.password = await bcrypt.hash(...)
// ```

// every single time.

// That's the purpose of the hook.

// ---

// # 13. Why `this` and `next` but not `req/res`?

// This is now easy to see:

// ```js
// userSchema.pre("save", async function(next) {
// ```

// ### `this`

// Mongoose uses `this` to represent the **document involved in the operation**.

// ```js
// this.password
// this.username
// this._id
// ```

// ### `next`

// Mongoose's middleware continuation/error callback.

// ```js
// next()
// next(error)
// ```

// ### `req/res`

// Not present because this isn't an HTTP middleware.

// ---

// # 14. The three different `next`s you've now encountered

// This is worth remembering.

// ### Express

// ```js
// (req, res, next)
// ```

// ```js
// next()
// ```

// → continue Express request pipeline.

// ```js
// next(error)
// ```

// → go to Express error middleware.

// ---

// ### Mongoose callback middleware

// ```js
// function(next)
// ```

// ```js
// next()
// ```

// → continue Mongoose operation.

// ```js
// next(error)
// ```

// → tell Mongoose middleware failed.

// ---

// ### Async Mongoose middleware

// ```js
// async function() {
//     await something();
// }
// ```

// No `next` is necessary because:

// ```text
// Promise resolves → success
// Promise rejects → failure
// ```

// ---

// ## So for your exact code, I'd write it as:

// ```js
// userSchema.pre("save", async function() {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

// });
// ```

// This is probably the cleanest version for what you're doing.

// And the key mental model is:

// > **`async` does not mean "I need try/catch." It means the function's success/failure is represented by a Promise. `try/catch` is only needed when you want to handle or transform the error locally.**

// Also, **Express middleware and Mongoose middleware are separate systems**. The `(req, res, next)` signature belongs to Express HTTP middleware; Mongoose's `pre("save")` middleware operates on Mongoose documents and therefore has no `req`/`res`.













//CHATGPT
// Absolutely. Since you're building this backend yourself, it's worth understanding **access tokens and refresh tokens from the authentication architecture**, not just memorizing the JWT code.

// The simplest idea is:

// > **Access token = temporary permission to access protected resources.**
// > **Refresh token = longer-lived credential used to obtain a new access token.**

// ---

// # 1. First understand the problem they solve

// Imagine you log into YouTube.

// You send:

// ```text
// email: abc@gmail.com
// password: mypassword
// ```

// The server verifies your password.

// Now suppose you want to:

// ```text
// GET /api/videos
// POST /api/comments
// GET /api/profile
// POST /api/like
// ```

// Do you want to send your password with **every single request**?

// Obviously not.

// Instead, after successful login, the server gives you a credential.

// That credential is usually an **access token**.

// So:

// ```text
// LOGIN
//    ↓
// email + password
//    ↓
// server verifies
//    ↓
// Access Token + Refresh Token
// ```

// Then future requests use the access token.

// ---

// # 2. What is an access token?

// An access token is a credential that says approximately:

// > "This request has been authenticated as this user, and the server can use this token to determine who the user is and whether they are authorized."

// For example:

// ```text
// GET /api/profile
// Authorization: Bearer eyJhbGciOiJIUzI1Ni...
// ```

// The server receives the token.

// It verifies it.

// If valid:

// ```text
// Token
//   ↓
// verify signature
//   ↓
// extract user information
//   ↓
// identify user
//   ↓
// allow request
// ```

// ---

// # 3. Your `generateAccessToken()` function

// You wrote:

// ```js
// userSchema.methods.generateAccessToken = function() {

//     return jwt.sign({
//         _id: this._id,
//         email: this.email,
//         username: this.username,
//         fullName: this.fullName
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     {
//         expiresIn: process.env.ACCESS_TOKEN_EXPIRY
//     });

// }
// ```

// Let's understand what `jwt.sign()` is doing.

// You provide:

// ### Payload

// ```js
// {
//     _id: this._id,
//     email: this.email,
//     username: this.username,
//     fullName: this.fullName
// }
// ```

// ### Secret

// ```js
// process.env.ACCESS_TOKEN_SECRET
// ```

// ### Expiration

// ```js
// process.env.ACCESS_TOKEN_EXPIRY
// ```

// And JWT generates something like:

// ```text
// xxxxx.yyyyy.zzzzz
// ```

// That's the access token.

// ---

// # 4. What is actually inside a JWT?

// A JWT has three parts:

// ```text
// HEADER.PAYLOAD.SIGNATURE
// ```

// For example:

// ```text
// eyJhbGciOiJIUzI1NiJ9
// .
// eyJfaWQiOiIxMjMiLCJ1c2VybmFtZSI6InNh...
// .
// abc123signature...
// ```

// ### Header

// Contains information about the token, such as the algorithm.

// ### Payload

// Contains claims/data.

// Your payload might conceptually contain:

// ```json
// {
//     "_id": "123",
//     "email": "abc@gmail.com",
//     "username": "saksham",
//     "fullName": "Saksham Agrawal"
// }
// ```

// ### Signature

// The server creates the signature using:

// ```text
// payload + secret
// ```

// This allows the server to determine whether the token was modified.

// ---

// # 5. Important: JWT is not encryption

// This is a very important security concept.

// A JWT payload is generally **encoded, not encrypted**.

// Therefore you should NOT put sensitive information such as:

// ```text
// password
// credit card number
// private secrets
// ```

// inside the JWT payload.

// Your access token contains:

// ```js
// {
//     _id,
//     email,
//     username,
//     fullName
// }
// ```

// which is reasonable for this purpose.

// ---

// # 6. Why does the access token expire?

// You have:

// ```js
// expiresIn: process.env.ACCESS_TOKEN_EXPIRY
// ```

// Suppose:

// ```env
// ACCESS_TOKEN_EXPIRY=15m
// ```

// Then the token is valid for approximately 15 minutes.

// Why not make it valid forever?

// Because tokens can potentially be stolen.

// Imagine someone obtains your access token.

// If it never expires:

// ```text
// stolen token
//     ↓
// attacker can potentially use it
//     ↓
// until the token is otherwise invalidated
// ```

// With a short expiration:

// ```text
// stolen token
//     ↓
// eventually expires
//     ↓
// cannot be used after expiration
// ```

// So access tokens are generally **short-lived**.

// ---

// # 7. Then we have a problem

// Suppose your access token lasts only 15 minutes.

// You log in:

// ```text
// 10:00 AM → login
// ```

// At:

// ```text
// 10:15 AM
// ```

// the access token expires.

// Should the user have to enter their:

// ```text
// email
// password
// ```

// again?

// That would be annoying.

// This is where the **refresh token** comes in.

// ---

// # 8. What is a refresh token?

// A refresh token is a longer-lived credential used to obtain a **new access token** after the current access token expires.

// Think:

// ```text
// Access Token
//     ↓
// short life
//     ↓
// used for API requests
// ```

// while:

// ```text
// Refresh Token
//     ↓
// longer life
//     ↓
// used to obtain new access tokens
// ```

// ---

// # 9. A simple analogy

// Imagine entering a building.

// The security desk gives you a temporary visitor badge:

// ```text
// Access Token
// ```

// The badge works for a short period.

// You also have a special authorization card:

// ```text
// Refresh Token
// ```

// When your visitor badge expires, you can use the authorization card to get a new visitor badge without going through the entire registration process again.

// So:

// ```text
// Refresh token
//        ↓
// new access token
//        ↓
// API requests
// ```

// ---

// # 10. Your refresh token

// You wrote:

// ```js
// userSchema.methods.generateRefreshToken = function() {

//     return jwt.sign({
//         _id: this._id,
//     },
//     process.env.REFRESH_TOKEN_SECRET,
//     {
//         expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//     });

// }
// ```

// Notice how different it is from your access token.

// Access token:

// ```js
// {
//     _id: this._id,
//     email: this.email,
//     username: this.username,
//     fullName: this.fullName
// }
// ```

// Refresh token:

// ```js
// {
//     _id: this._id
// }
// ```

// The refresh token contains much less information.

// ---

// # 11. Why only `_id`?

// Because the refresh token's main purpose isn't:

// > "Give me all the user's information."

// Its purpose is:

// > "Identify which user is requesting a new access token."

// The server can then use:

// ```text
// user ID
//    ↓
// find user in database
//    ↓
// verify refresh token
//    ↓
// generate new access token
// ```

// ---

// # 12. Notice the different secrets

// You have:

// ```js
// process.env.ACCESS_TOKEN_SECRET
// ```

// for access tokens.

// And:

// ```js
// process.env.REFRESH_TOKEN_SECRET
// ```

// for refresh tokens.

// This is intentional.

// You don't want the same secret used for both types of credentials.

// So:

// ```text
// ACCESS_TOKEN_SECRET
//        ↓
// Access Tokens
// ```

// and:

// ```text
// REFRESH_TOKEN_SECRET
//        ↓
// Refresh Tokens
// ```

// are separate cryptographic trust domains.

// ---

// # 13. The complete login process

// Let's imagine:

// ```text
// User:
// email = abc@gmail.com
// password = hello123
// ```

// They send:

// ```http
// POST /login
// ```

// with their credentials.

// ### Step 1 — server finds user

// ```text
// email
//  ↓
// User.findOne()
//  ↓
// user
// ```

// ### Step 2 — server checks password

// Your method:

// ```js
// await user.isPasswordCorrect(password);
// ```

// internally:

// ```js
// bcrypt.compare(password, this.password)
// ```

// If correct:

// ```text
// password correct
//        ↓
// continue
// ```

// ---

// # 14. Generate both tokens

// The server does:

// ```js
// const accessToken = user.generateAccessToken();
// const refreshToken = user.generateRefreshToken();
// ```

// Now:

// ```text
//                     LOGIN
//                       ↓
//               verify credentials
//                       ↓
//              ┌────────┴────────┐
//              ↓                 ↓
//        Access Token       Refresh Token
//        short-lived        long-lived
//        API requests       get new access
// ```

// ---

// # 15. Where are they stored?

// There are several possible architectures.

// A common browser-based design is:

// ```text
// Access token
//     ↓
// kept in client memory or another appropriately protected mechanism
// ```

// and:

// ```text
// Refresh token
//     ↓
// Secure, HttpOnly cookie
// ```

// The exact storage strategy depends on the application architecture and threat model.

// For example, an `HttpOnly` cookie prevents normal JavaScript from directly reading the cookie.

// Your backend also has:

// ```js
// refreshToken: {
//     type: String
// }
// ```

// in your User schema.

// That suggests your tutorial may store/track a refresh token associated with the user in the database as well.

// ---

// # 16. What happens during normal API requests?

// Suppose your access token is:

// ```text
// ACCESS_TOKEN_ABC
// ```

// The client makes:

// ```http
// GET /profile
// Authorization: Bearer ACCESS_TOKEN_ABC
// ```

// Server:

// ```text
// Receive request
//       ↓
// Extract access token
//       ↓
// jwt.verify(accessToken, ACCESS_TOKEN_SECRET)
//       ↓
// valid?
//   ┌───┴───┐
//  YES      NO
//   ↓        ↓
// find/identify  reject
// user
//   ↓
// continue
// ```

// This is where an authentication middleware often comes in.

// Something like:

// ```js
// const verifyJWT = async (req, res, next) => {
//     // verify access token
//     // identify user
//     // attach user to req
//     next();
// };
// ```

// Then a protected route can use:

// ```js
// app.get("/profile", verifyJWT, getProfile);
// ```

// ---

// # 17. What happens when the access token expires?

// Suppose:

// ```text
// Access token → expired
// Refresh token → still valid
// ```

// Client requests:

// ```text
// GET /profile
// ```

// The access token fails verification.

// The client then sends a refresh request, conceptually:

// ```http
// POST /refresh-token
// ```

// with the refresh token.

// Server:

// ```text
// Refresh Token
//       ↓
// verify signature
//       ↓
// check expiration
//       ↓
// identify user
//       ↓
// possibly compare against stored refresh token
//       ↓
// generate NEW access token
//       ↓
// send new access token
// ```

// Now the user can continue using the application without entering their password again.

// ---

// # 18. Why not just make the access token last a very long time?

// You might ask:

// > Why not make access token valid for 30 days and forget about refresh tokens?

// You can technically design authentication systems differently, but there is a security tradeoff.

// A long-lived access token means:

// ```text
// If access token is stolen
//         ↓
// attacker potentially has access
//         ↓
// for a long time
// ```

// Short-lived access tokens reduce that window.

// Refresh tokens are separated because they aren't supposed to be sent with every API request.

// So you get:

// ```text
//               Security / usability tradeoff

// Short access token
//       +
// Longer refresh token
//       ↓
// short exposure window for API credential
// +
// user doesn't have to repeatedly log in
// ```

// ---

// # 19. Access token vs refresh token

// |                                | Access Token                   | Refresh Token                |
// | ------------------------------ | ------------------------------ | ---------------------------- |
// | Main purpose                   | Access protected APIs          | Obtain new access token      |
// | Lifetime                       | Usually shorter                | Usually longer               |
// | Used frequently?               | Yes                            | No                           |
// | Sent with normal API requests? | Yes                            | Generally no                 |
// | Payload                        | Often contains user claims     | Often minimal, e.g. user ID  |
// | Secret                         | Access-token secret            | Refresh-token secret         |
// | If expired                     | Need refresh/re-authentication | Need login/re-authentication |
// | Sensitivity                    | Sensitive                      | **Very sensitive**           |

// The exact lifetimes and storage mechanisms are application choices.

// ---

// # 20. Why your User schema has `refreshToken`

// You have:

// ```js
// refreshToken: {
//     type: String
// }
// ```

// This allows the server to associate a refresh token with the user.

// For example, after login:

// ```js
// user.refreshToken = refreshToken;
// await user.save();
// ```

// Now the database might conceptually contain:

// ```text
// User
// ────────────────────────────
// _id           → 123
// username      → saksham
// email         → abc@gmail.com
// refreshToken  → xyz...
// ```

// Later, when the client asks for a new access token, the server can check the supplied refresh credential against what it expects for that user.

// There are more secure designs for storing refresh-token credentials, such as storing a hash rather than the raw token, depending on the application.

// ---

// # 21. Why access token doesn't need to be stored in the database

// JWT access tokens are often **self-contained**.

// The server can verify:

// ```js
// jwt.verify(token, ACCESS_TOKEN_SECRET)
// ```

// and obtain the claims.

// Conceptually:

// ```text
// Access Token
//      ↓
// verify signature
//      ↓
// payload
// {
//     _id,
//     email,
//     username,
//     ...
// }
// ```

// Therefore you don't necessarily need a database lookup just to validate the JWT.

// You may still query the database for authorization, current user state, revocation, roles, etc.

// ---

// # 22. Why does the refresh token often involve the database?

// Because refresh tokens are more powerful.

// The server may want the ability to say:

// > "This refresh token is no longer valid."

// For example, when the user logs out:

// ```text
// logout
//   ↓
// invalidate refresh token
// ```

// Then even if someone has the old refresh token, the server can reject it.

// This is one reason your:

// ```js
// refreshToken: String
// ```

// field exists.

// ---

// # 23. A very important distinction: authentication vs authorization

// Access tokens are primarily involved in **authentication**:

// > "Who is making this request?"

// For example:

// ```text
// _id = 123
// ```

// But you can also use claims/DB information for **authorization**:

// > "Is this user allowed to perform this action?"

// For example:

// ```text
// User authenticated?
//        ↓
// Yes
//        ↓
// Is user an admin?
//        ↓
// Yes → allow
// No  → reject
// ```

// So don't think:

// > JWT = authorization

// JWT can carry identity/claims that are then used in authentication and authorization decisions.

// ---

// # 24. How this connects to the code you already have

// Your User model:

// ```js
// userSchema.methods.generateAccessToken = function() {
//     return jwt.sign(
//         {
//             _id: this._id,
//             email: this.email,
//             username: this.username,
//             fullName: this.fullName
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         {
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
//         }
//     );
// };
// ```

// means:

// > "Given a User document, create a short-lived JWT that represents this user."

// And:

// ```js
// userSchema.methods.generateRefreshToken = function() {
//     return jwt.sign(
//         {
//             _id: this._id
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRY
//         }
//     );
// };
// ```

// means:

// > "Given a User document, create a longer-lived JWT that can be used to obtain a new access token."

// So when you eventually write your login controller, you'll probably have a flow conceptually like:

// ```js
// const user = await User.findOne({ email });

// const isPasswordValid = await user.isPasswordCorrect(password);

// if (!isPasswordValid) {
//     throw new ApiError(401, "Invalid credentials");
// }

// const accessToken = user.generateAccessToken();
// const refreshToken = user.generateRefreshToken();
// ```

// Then your application needs to securely deliver/store those credentials according to your chosen authentication design.

// ---

// # 25. The whole picture

// This is probably the most useful diagram to remember:

// ```text
//                          LOGIN
//                            │
//                   email + password
//                            │
//                            ▼
//                     Verify password
//                            │
//                            ▼
//                   ┌────────┴────────┐
//                   │                 │
//                   ▼                 ▼
//             ACCESS TOKEN       REFRESH TOKEN
//             short-lived        longer-lived
//                   │                 │
//                   │                 │
//          Normal API requests       │
//                   │                 │
//                   ▼                 │
//           Authorization: Bearer    │
//                   │                 │
//                   ▼                 │
//              API SERVER             │
//                   │                 │
//             verify access           │
//                   │                 │
//             ┌─────┴─────┐           │
//             │           │           │
//           valid       expired       │
//             │           │           │
//             ▼           ▼           │
//           allow     refresh flow ◄──┘
//                         │
//                         ▼
//                  verify refresh
//                         │
//                         ▼
//                 NEW ACCESS TOKEN
//                         │
//                         ▼
//                   continue using
//                   application
// ```

// ### The one-line memory trick:

// **Access token:** *"Can I access the API right now?"*

// **Refresh token:** *"My access token expired; can I get a new one without logging in again?"*

// And one important security principle: **a refresh token is not a "better access token."** It has a different purpose and should generally be exposed less often and protected more carefully because possession of a valid refresh credential can enable continued issuance of access credentials.
















//CHATGPT
// Yes. This is a very good point to slow down, because you're now moving from **"how do I use Mongoose?"** to **"how does Mongoose actually work?"**

// Your two files use several important Mongoose concepts:

// 1. **Schema**
// 2. **Schema options**
// 3. **Schema middleware/hooks — `pre()`**
// 4. **Instance/document methods — `methods`**
// 5. **Plugins — `plugin()`**
// 6. **References — `ref`**
// 7. **Mongoose Model**
// 8. **Virtuals** — another related concept you should know
// 9. **Statics** — another related concept
// 10. **Query middleware** — another type of middleware
// 11. **Aggregation/pagination plugins**
// 12. **Validation, getters/setters, transforms** — other schema customization mechanisms

// I'll build the mental model first, then explain your exact code.

// ---

// # 1. First: what is a Mongoose Schema?

// You have:

// ```js
// const userSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         required: true
//     }
// });
// ```

// A schema is basically a **description of what a document should look like and what behavior it should have**.

// Think of it as:

// ```text
//                     User Schema
//                         │
//           ┌─────────────┼──────────────┐
//           ↓             ↓              ↓
//        Fields       Validation       Behavior
//           │                             │
//      username                       pre()
//      email                          methods
//      password                       virtuals
//      avatar                         statics
// ```

// So a Mongoose schema is more than just a database structure.

// It can contain:

// * fields
// * types
// * validation rules
// * middleware
// * instance methods
// * static methods
// * virtual properties
// * plugins
// * indexes
// * getters/setters
// * transformations

// This is the important mental model.

// ---

// # 2. Schema → Model → Document

// This distinction is extremely important.

// You create:

// ```js
// const userSchema = new mongoose.Schema({...});
// ```

// That's the **blueprint**.

// Then:

// ```js
// export const User = mongoose.model("User", userSchema);
// ```

// creates the **Model**.

// Think:

// ```text
// Schema
//   │
//   │ mongoose.model()
//   ↓
// Model
//   │
//   │ creates/reads
//   ↓
// Documents
// ```

// For example:

// ```js
// const user = new User({
//     username: "saksham",
//     email: "abc@gmail.com",
//     password: "123456"
// });
// ```

// `user` is a **document**.

// So:

// ```js
// User
// ```

// is the model.

// ```js
// user
// ```

// is an individual document.

// And:

// ```js
// userSchema
// ```

// is the blueprint that describes the model/document behavior.

// ---

// # 3. Now let's understand `pre()`

// You have:

// ```js
// userSchema.pre("save", async function(next) {

//     if(this.isModified("password")) {
//         this.password = bcrypt.hash(this.password, 10)
//     }

//     next()
// })
// ```

// This is called a **Mongoose middleware/hook**.

// The idea is:

// > "Before a particular Mongoose operation happens, run this function."

// Here:

// ```js
// pre("save", ...)
// ```

// means:

// > **Before a User document is saved, execute this function.**

// Think:

// ```text
// user.save()
//     ↓
// PRE SAVE middleware
//     ↓
// actual save to MongoDB
// ```

// ---

// # 4. Why is it called `pre`?

// Because there is also:

// ```js
// schema.post(...)
// ```

// So:

// ```js
// schema.pre("save", ...)
// ```

// means:

// ```text
// BEFORE save
// ```

// while:

// ```js
// schema.post("save", ...)
// ```

// means:

// ```text
// AFTER save
// ```

// For example:

// ```js
// userSchema.pre("save", function(next) {
//     console.log("Before saving");
//     next();
// });

// userSchema.post("save", function(doc) {
//     console.log("After saving");
// });
// ```

// When:

// ```js
// user.save();
// ```

// happens:

// ```text
// user.save()
//     ↓
// "Before saving"
//     ↓
// MongoDB save
//     ↓
// "After saving"
// ```

// ---

// # 5. Why do we need `pre("save")` here?

// Because of password hashing.

// Suppose the user enters:

// ```text
// password123
// ```

// You **do not want** to store:

// ```text
// password123
// ```

// in MongoDB.

// Instead you want something like:

// ```text
// $2b$10$...
// ```

// That's a bcrypt hash.

// So before saving:

// ```text
// User enters password
//        ↓
// password123
//        ↓
// pre("save")
//        ↓
// bcrypt hash
//        ↓
// $2b$10$...
//        ↓
// MongoDB
// ```

// This is exactly what your middleware is trying to achieve.

// ---

// # 6. VERY IMPORTANT: your bcrypt line has a bug

// You currently have:

// ```js
// this.password = bcrypt.hash(this.password, 10)
// ```

// `bcrypt.hash()` is asynchronous and returns a **Promise**.

// You need:

// ```js
// this.password = await bcrypt.hash(this.password, 10)
// ```

// So:

// ```js
// userSchema.pre("save", async function(next) {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

//     next();
// });
// ```

// Otherwise you're assigning the Promise itself rather than the resulting hash.

// ---

// # 7. What is `this` here?

// This is one of the most important reasons your comment says:

// ```js
// // DO NOT USE ARROW FUNCTION AS IT DOES NOT HAVE CONTEXT OF THIS
// ```

// You have:

// ```js
// async function(next) {
// ```

// not:

// ```js
// async (next) => {
// ```

// Mongoose calls this middleware function with `this` referring to the document being saved.

// Suppose:

// ```js
// const user = new User({
//     username: "saksham",
//     password: "abc123"
// });
// ```

// Then:

// ```js
// user.save();
// ```

// causes Mongoose to execute your middleware.

// Inside the middleware:

// ```js
// this
// ```

// refers approximately to:

// ```text
// this
//  ↓
// user document
// ```

// Therefore:

// ```js
// this.password
// ```

// means:

// ```js
// user.password
// ```

// and:

// ```js
// this.isModified("password")
// ```

// means:

// > "Is the password field of this particular document modified?"

// ---

// # 8. Why doesn't arrow function work?

// Normal function:

// ```js
// function(next) {
//     console.log(this);
// }
// ```

// has its `this` determined by **how the function is called**.

// Mongoose can call it with the document as its context.

// Arrow function:

// ```js
// (next) => {
//     console.log(this);
// }
// ```

// doesn't create its own `this`.

// It inherits `this` from the surrounding scope.

// Therefore Mongoose cannot provide the document as `this` in the same way.

// So:

// ```js
// userSchema.pre("save", async function(next) {
// ```

// is intentional.

// ---

// # 9. What is `isModified()`?

// This:

// ```js
// this.isModified("password")
// ```

// is a Mongoose document method.

// It asks:

// > "Has the password field been changed since this document was loaded/saved?"

// Why do we need this?

// Imagine you create:

// ```js
// User({
//     username: "abc",
//     password: "hello"
// });
// ```

// First save:

// ```text
// hello
//  ↓
// hash
//  ↓
// $2b$...
// ```

// Later you update:

// ```js
// user.username = "newname";
// await user.save();
// ```

// If you hashed the password **every time**, you'd do:

// ```text
// existing hash
//     ↓
// bcrypt.hash()
//     ↓
// another hash
// ```

// Now the original hash gets hashed again.

// That's bad.

// So:

// ```js
// if (this.isModified("password"))
// ```

// means:

// > Only hash the password when the password has actually changed.

// ---

// # 10. What is `next()`?

// Your middleware receives:

// ```js
// async function(next)
// ```

// `next()` tells Mongoose:

// > **"I'm finished with this middleware; continue the save process."**

// Similar to Express's `next()`, but this is **Mongoose middleware**, not Express middleware.

// Conceptually:

// ```text
// user.save()
//     ↓
// pre-save middleware
//     ↓
// next()
//     ↓
// continue
//     ↓
// save document
// ```

// However, since you're using an `async` function, there's a cleaner modern pattern where you can simply `await` and let the async function resolve rather than manually using `next()`.

// For example:

// ```js
// userSchema.pre("save", async function() {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

// });
// ```

// Mongoose can recognize the returned Promise from the async middleware.

// ---

// # 11. Now let's move to `methods`

// You have:

// ```js
// userSchema.methods.isPasswordCorrect = async function(password) {
//     return await bcrypt.compare(password, this.password);
// };
// ```

// This is another major concept.

// `schema.methods` is where you define **methods that individual documents can use**.

// For example:

// ```js
// const user = await User.findOne({ username: "saksham" });
// ```

// Then:

// ```js
// user.isPasswordCorrect("mypassword");
// ```

// works.

// Why?

// Because you defined:

// ```js
// userSchema.methods.isPasswordCorrect
// ```

// So:

// ```text
// Schema
//   ↓
// methods
//   ↓
// every User document gets those methods
// ```

// ---

// # 12. Think of `methods` as "abilities of a document"

// Suppose:

// ```js
// userSchema.methods.sayHello = function() {
//     console.log(`Hello ${this.username}`);
// };
// ```

// Then:

// ```js
// const user = await User.findOne();

// user.sayHello();
// ```

// works.

// And:

// ```js
// this
// ```

// inside the method refers to that specific user.

// For example:

// ```js
// user1.sayHello();
// ```

// ```text
// this → user1
// ```

// while:

// ```js
// user2.sayHello();
// ```

// ```text
// this → user2
// ```

// That's why they're called **instance/document methods**.

// ---

// # 13. Your password method

// You wrote:

// ```js
// userSchema.methods.isPasswordCorrect = async function(password) {

//     return await bcrypt.compare(password, this.password);

// }
// ```

// Suppose database contains:

// ```text
// password:
// $2b$10$someHash...
// ```

// And login request contains:

// ```text
// password:
// hello123
// ```

// You do:

// ```js
// const isCorrect = await user.isPasswordCorrect("hello123");
// ```

// Internally:

// ```text
// "hello123"
//      ↓
// bcrypt.compare()
//      ↓
// compare against this.password
//      ↓
// true / false
// ```

// So:

// ```js
// this.password
// ```

// is the password hash belonging to **that particular user**.

// ---

// # 14. Why not make it a normal function?

// You could write:

// ```js
// const isPasswordCorrect = async (user, password) => {
//     return bcrypt.compare(password, user.password);
// };
// ```

// Then:

// ```js
// isPasswordCorrect(user, password);
// ```

// That works.

// But Mongoose methods let you make the operation naturally belong to the document:

// ```js
// user.isPasswordCorrect(password);
// ```

// Instead of:

// ```js
// isPasswordCorrect(user, password);
// ```

// This is one reason instance methods are useful.

// ---

// # 15. Your `generateAccessToken()`

// You have:

// ```js
// userSchema.methods.generateAccessToken = function() {

//     return jwt.sign({
//         _id: this._id,
//         email: this.email,
//         username: this.username,
//         fullName: this.fullName
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     {
//         expiresIn: process.env.ACCESS_TOKEN_EXPIRY
//     });

// };
// ```

// Again:

// ```js
// userSchema.methods
// ```

// means every User document gets this method.

// So:

// ```js
// const user = await User.findOne(...);

// const token = user.generateAccessToken();
// ```

// Inside:

// ```js
// this
// ```

// is that user.

// So:

// ```js
// this._id
// this.email
// this.username
// this.fullName
// ```

// come from that specific document.

// ---

// # 16. Why define this as a method?

// Because generating an access token is an operation that logically belongs to a user.

// Instead of:

// ```js
// generateAccessToken(user)
// ```

// you can write:

// ```js
// user.generateAccessToken()
// ```

// It's an example of **encapsulating behavior with data**.

// Your User document contains:

// ```text
// DATA
// ├── username
// ├── email
// ├── fullName
// └── ...

// BEHAVIOR
// ├── isPasswordCorrect()
// ├── generateAccessToken()
// └── generateRefreshToken()
// ```

// That's a powerful concept.

// ---

// # 17. Access token vs refresh token

// Your two methods:

// ```js
// generateAccessToken()
// ```

// and:

// ```js
// generateRefreshToken()
// ```

// both create JWTs.

// But they contain different payloads.

// Access:

// ```js
// {
//     _id: this._id,
//     email: this.email,
//     username: this.username,
//     fullName: this.fullName
// }
// ```

// Refresh:

// ```js
// {
//     _id: this._id
// }
// ```

// And they use different secrets:

// ```js
// process.env.ACCESS_TOKEN_SECRET
// ```

// versus:

// ```js
// process.env.REFRESH_TOKEN_SECRET
// ```

// This is application authentication architecture rather than a special Mongoose feature.

// ---

// # 18. Now let's understand `plugin()`

// Your Video schema has:

// ```js
// videoSchema.plugin(mongooseAggregatePaginate)
// ```

// This is the third major concept.

// A Mongoose plugin is essentially a **reusable piece of functionality that can modify/extend a schema**.

// Think:

// ```text
// Schema
//   +
// Plugin
//   ↓
// Extended Schema
// ```

// The plugin can add things such as:

// * methods
// * statics
// * middleware
// * virtuals
// * schema functionality
// * other behavior

// ---

// # 19. Why use a plugin?

// Imagine you have:

// ```text
// User
// Video
// Comment
// Post
// Playlist
// ```

// And you want all of them to support some common functionality.

// Instead of manually writing the same code for every schema, you create reusable functionality.

// Conceptually:

// ```js
// function myPlugin(schema) {
//     // modify schema
// }
// ```

// Then:

// ```js
// userSchema.plugin(myPlugin);
// videoSchema.plugin(myPlugin);
// ```

// Now both schemas receive that functionality.

// That's the core idea of a plugin.

// ---

// # 20. Your particular plugin

// You imported:

// ```js
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// ```

// Then:

// ```js
// videoSchema.plugin(mongooseAggregatePaginate);
// ```

// This particular third-party plugin adds aggregation pagination functionality to the Video model.

// After the plugin is applied, you can use the functionality provided by that plugin on your aggregation queries.

// The important thing isn't just memorizing:

// ```js
// videoSchema.plugin(...)
// ```

// The deeper concept is:

// > **A plugin is a function that receives a schema and extends/configures it.**

// ---

// # 21. You can actually create your own plugin

// This is where you can really understand what Mongoose plugins are.

// For example:

// ```js
// function addCreatedByMessage(schema) {

//     schema.methods.sayCreatedBy = function() {
//         console.log(`Created by ${this.username}`);
//     };

// }
// ```

// Then:

// ```js
// userSchema.plugin(addCreatedByMessage);
// ```

// Now every User document gets:

// ```js
// user.sayCreatedBy();
// ```

// Why?

// Because your plugin received the schema:

// ```text
// addCreatedByMessage(userSchema)
//           ↓
// schema.methods.sayCreatedBy = ...
//           ↓
// User documents get sayCreatedBy()
// ```

// That's essentially the fundamental idea behind Mongoose plugins.

// ---

// # 22. You can make plugins much more powerful

// For example:

// ```js
// function timestampPlugin(schema) {

//     schema.add({
//         lastModifiedByPlugin: {
//             type: Date
//         }
//     });

//     schema.pre("save", function(next) {
//         this.lastModifiedByPlugin = new Date();
//         next();
//     });

// }
// ```

// Then:

// ```js
// userSchema.plugin(timestampPlugin);
// ```

// Now the plugin has:

// * added a field
// * added middleware

// This demonstrates something important:

// > A plugin isn't a magical special object. It's reusable code that receives a schema and modifies/configures it.

// ---

// # 23. `ref: "Video"` and `ref: "User"`

// You also have:

// ```js
// watchHistory: [
//     {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Video"
//     }
// ]
// ```

// This is another important Mongoose concept.

// You're saying:

// > `watchHistory` contains ObjectIds that refer to documents in the `Video` model.

// For example:

// ```text
// User
// _id: A123
// watchHistory:
// [
//     V111,
//     V222,
//     V333
// ]
// ```

// Those IDs correspond to:

// ```text
// Video
// _id: V111
// _id: V222
// _id: V333
// ```

// Then Mongoose can use:

// ```js
// .populate("watchHistory")
// ```

// to replace those IDs with the corresponding documents.

// ---

// # 24. `owner` does the opposite direction

// Video:

// ```js
// owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
// }
// ```

// means:

// ```text
// Video
//   |
//   └── owner → User._id
// ```

// So:

// ```js
// const video = await Video.findById(id).populate("owner");
// ```

// can give you the user document instead of only the ObjectId.

// ---

// # 25. Your models now form a relationship

// You essentially have:

// ```text
//              User
//               │
//        ┌──────┴───────┐
//        │              │
//  watchHistory        owns
//        │              │
//        ↓              ↓
//      Video ←──────── owner
// ```

// This is similar conceptually to relationships in SQL databases, although MongoDB stores documents differently.

// ---

// # 26. Another concept: `timestamps`

// You have:

// ```js
// {
//     timestamps: true
// }
// ```

// This tells Mongoose to automatically maintain:

// ```js
// createdAt
// updatedAt
// ```

// So when you create a user:

// ```js
// {
//     username: "abc",
//     createdAt: ...,
//     updatedAt: ...
// }
// ```

// And when you update them:

// ```text
// createdAt → stays the same
// updatedAt → changes
// ```

// Again, this is **schema configuration**.

// ---

// # 27. Now let's organize all these concepts

// Your schema can be thought of as having several layers.

// ```text
//                     Mongoose Schema
//                           │
//        ┌──────────────────┼────────────────────┐
//        │                  │                    │
//       DATA             BEHAVIOR            EXTENSIONS
//        │                  │                    │
//        ↓                  ↓                    ↓
//     fields             methods              plugins
//     types               pre()               ...
//     validation          post()
//     indexes             virtuals
// ```

// Your code uses:

// ### Data

// ```js
// username
// email
// password
// avatar
// owner
// watchHistory
// ```

// ### Schema configuration

// ```js
// required
// unique
// lowercase
// trim
// index
// timestamps
// ```

// ### Middleware

// ```js
// userSchema.pre("save", ...)
// ```

// ### Instance methods

// ```js
// userSchema.methods.isPasswordCorrect = ...
// userSchema.methods.generateAccessToken = ...
// userSchema.methods.generateRefreshToken = ...
// ```

// ### Plugin

// ```js
// videoSchema.plugin(mongooseAggregatePaginate)
// ```

// ### Relationships

// ```js
// ref: "User"
// ref: "Video"
// ```

// ### Model

// ```js
// mongoose.model("User", userSchema)
// mongoose.model("Video", videoSchema)
// ```

// ---

// # 28. There are several other Mongoose concepts you should learn next

// Since you specifically want to understand the **underlying concepts so you can create them yourself**, these are the next things I'd learn.

// ## A. `schema.methods`

// You've already learned this:

// ```js
// userSchema.methods.someFunction = function() {};
// ```

// Used for **individual documents**.

// ```js
// user.someFunction();
// ```

// ---

// ## B. `schema.statics`

// This is very similar, but belongs to the **Model**, not individual documents.

// For example:

// ```js
// userSchema.statics.findByEmail = function(email) {
//     return this.findOne({ email });
// };
// ```

// Then:

// ```js
// User.findByEmail("abc@gmail.com");
// ```

// Notice:

// ```text
// methods
//    ↓
// user.findSomething()

// statics
//    ↓
// User.findSomething()
// ```

// This distinction is extremely important.

// ---

// ## C. `schema.virtual()`

// A virtual is a property that **isn't actually stored in MongoDB**.

// For example:

// ```js
// userSchema.virtual("fullInfo").get(function() {
//     return `${this.username} - ${this.email}`;
// });
// ```

// Then:

// ```js
// user.fullInfo
// ```

// might produce:

// ```text
// saksham - abc@gmail.com
// ```

// but MongoDB doesn't actually have a `fullInfo` field.

// ---

// ## D. `schema.post()`

// You know:

// ```js
// schema.pre()
// ```

// There is also:

// ```js
// schema.post()
// ```

// For example:

// ```js
// userSchema.post("save", function(doc) {
//     console.log("User saved:", doc._id);
// });
// ```

// Think:

// ```text
// pre → before operation
// post → after operation
// ```

// ---

// ## E. Query middleware

// This is different from document middleware.

// For example:

// ```js
// userSchema.pre("find", function(next) {
//     console.log("A find query is about to execute");
//     next();
// });
// ```

// Here you're intercepting a **query**, rather than a document's `save()`.

// There are different middleware types such as:

// ```text
// Document middleware
// Query middleware
// Aggregate middleware
// Model middleware
// ```

// Understanding this distinction will take you deeper into Mongoose.

// ---

// ## F. Custom validation

// You can define your own validation:

// ```js
// username: {
//     type: String,
//     validate: {
//         validator: function(value) {
//             return value.length >= 3;
//         },
//         message: "Username must contain at least 3 characters"
//     }
// }
// ```

// Now you're creating your own schema behavior.

// ---

// ## G. Setters and getters

// You can customize what happens when a value is assigned/read.

// For example:

// ```js
// username: {
//     type: String,
//     set: value => value.toLowerCase()
// }
// ```

// Then:

// ```js
// user.username = "SAKSHAM";
// ```

// can automatically store:

// ```text
// saksham
// ```

// This is another example of Mongoose allowing you to attach behavior to fields.

// ---

// # 29. The biggest mental model to remember

// Don't memorize:

// ```js
// schema.pre()
// schema.methods
// schema.plugin()
// schema.virtual()
// schema.statics
// ```

// as random Mongoose APIs.

// Instead ask:

// > **"What am I trying to attach to my schema?"**

// ### I want something to happen before/after an operation:

// ```js
// schema.pre()
// schema.post()
// ```

// ### I want every document to have a function:

// ```js
// schema.methods
// ```

// ### I want the Model itself to have a function:

// ```js
// schema.statics
// ```

// ### I want a calculated property that isn't stored:

// ```js
// schema.virtual()
// ```

// ### I want reusable functionality that can modify schemas:

// ```js
// schema.plugin()
// ```

// ### I want custom rules for field values:

// ```js
// validate
// ```

// That's the conceptual framework that will let you **build these yourself instead of merely copying tutorial code**.

// ---

// ## One correction I strongly recommend in your current code

// Change:

// ```js
// this.password = bcrypt.hash(this.password, 10)
// ```

// to:

// ```js
// this.password = await bcrypt.hash(this.password, 10);
// ```

// because `bcrypt.hash()` returns a Promise.

// So your middleware should at least be:

// ```js
// userSchema.pre("save", async function(next) {

//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }

//     next();
// });
// ```

// And conceptually, your entire User model is doing something quite elegant:

// ```text
//                     User Schema
//                          │
//         ┌────────────────┼─────────────────┐
//         ↓                ↓                 ↓
//       DATA            LIFECYCLE          BEHAVIOR
//         │                │                 │
//  username              pre-save       isPasswordCorrect()
//  email                                  generateAccessToken()
//  password                               generateRefreshToken()
//  avatar
//  watchHistory
//  refreshToken
// ```

// That's the deeper idea behind what you're seeing in this tutorial: **Mongoose isn't just mapping JavaScript objects to MongoDB. It gives you a way to attach data rules, lifecycle behavior, reusable functionality, and object behavior to your application's data models.**

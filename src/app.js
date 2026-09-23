import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))//to properly understand this and cookie-parser see chatgpt response pasted down


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
//all four above are middlewares between frontend and backend connection that tells backend what to recieve from user and also makes it easier to access through req.body or req.cookies etc it makes it easier to define what things sent by user are allowed at backend
//FOR MORE INFORMATION SEE CHATGPT RESPONSE AT LINE 647
//ABOVE FOUR HAVE next() INBUIT IN IT

export { app }







//CHATGPT for CORS and COOKIE-PARSER
// Absolutely. **CORS is one of those things that seems confusing until you understand the browser security problem it solves.**

// Your code:

// ```js
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// const app = express();

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));

// export { app };
// ```

// Let's understand it from the beginning.

// ---

// # 1. What is CORS?

// **CORS = Cross-Origin Resource Sharing**

// It is a **browser security mechanism** that controls whether a webpage from one origin is allowed to make requests to a server from another origin.

// The important word is **origin**.

// An origin consists of:

// ```text
// protocol + domain + port
// ```

// For example:

// ```text
// http://localhost:5173
// ```

// and:

// ```text
// http://localhost:8000
// ```

// are **different origins** because their ports are different.

// Similarly:

// ```text
// http://localhost:5173
// https://localhost:5173
// ```

// are different because the protocols are different.

// And:

// ```text
// http://localhost:5173
// http://example.com
// ```

// are different because the domains are different.

// ---

// # 2. Why do we need CORS?

// Suppose you're building your React frontend.

// Your frontend is running here:

// ```text
// http://localhost:5173
// ```

// Your Express backend is running here:

// ```text
// http://localhost:8000
// ```

// Your React code might do:

// ```js
// fetch("http://localhost:8000/api/users");
// ```

// The browser sees:

// ```text
// Frontend:
// localhost:5173

//         ↓ request

// Backend:
// localhost:8000
// ```

// These are **different origins**.

// Browsers have a security rule called the **Same-Origin Policy**.

// It basically says:

// > A webpage shouldn't automatically be allowed to freely access resources from another origin.

// This prevents malicious websites from making unauthorized requests to other websites using your browser.

// ---

// # 3. Example of the security problem

// Imagine you're logged into:

// ```text
// https://bank.com
// ```

// Your browser has your bank's authentication cookies.

// Now you visit:

// ```text
// https://evil.com
// ```

// Suppose `evil.com` runs:

// ```js
// fetch("https://bank.com/account");
// ```

// Without browser security restrictions, `evil.com` might be able to make requests to your bank using your existing browser credentials.

// That would be dangerous.

// So browsers enforce the **Same-Origin Policy**.

// ---

// # 4. Then what does CORS do?

// CORS allows the **server** to say:

// > "I trust requests coming from this particular origin."

// For example:

// ```text
// React:
// http://localhost:5173

//         ↓

// Express:
// http://localhost:8000
// ```

// Your Express server can respond with a header saying:

// ```http
// Access-Control-Allow-Origin: http://localhost:5173
// ```

// The browser sees this and says:

// > Okay, the server explicitly allows this frontend to access the response.

// That's what CORS is about.

// ---

// # 5. What does this package do?

// You wrote:

// ```js
// import cors from "cors";
// ```

// `cors` is an Express middleware package that makes configuring these CORS response headers easier.

// Instead of manually writing:

// ```js
// res.setHeader(
//     "Access-Control-Allow-Origin",
//     "http://localhost:5173"
// );
// ```

// you can use:

// ```js
// app.use(cors(...));
// ```

// The package handles the appropriate CORS headers for you.

// ---

// # 6. Now let's understand your exact code

// You have:

// ```js
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));
// ```

// This means:

// > "For requests coming to my Express server, configure CORS according to these rules."

// ---

// # 7. `origin: process.env.CORS_ORIGIN`

// This is the most important part.

// Suppose your `.env` contains:

// ```env
// CORS_ORIGIN=http://localhost:5173
// ```

// Then:

// ```js
// origin: process.env.CORS_ORIGIN
// ```

// becomes:

// ```js
// origin: "http://localhost:5173"
// ```

// So you're telling the CORS middleware:

// > Allow my frontend at `http://localhost:5173` to access this backend.

// Your architecture becomes:

// ```text
// React
// http://localhost:5173
//        │
//        │ fetch()
//        ▼
// Express
// http://localhost:8000
//        │
//        ▼
// MongoDB
// ```

// And your backend is saying:

// ```text
// "I allow http://localhost:5173"
// ```

// ---

// # 8. Why not simply use `*`?

// You might see:

// ```js
// app.use(cors({
//     origin: "*"
// }));
// ```

// That means:

// > Allow requests from any origin.

// For example:

// ```text
// http://localhost:5173       ✅
// http://localhost:3000       ✅
// http://example.com          ✅
// http://random-site.com      ✅
// ```

// That's sometimes useful for public APIs, but it's usually not what you want for an application involving authentication/cookies.

// Your configuration is more restrictive:

// ```js
// origin: process.env.CORS_ORIGIN
// ```

// Only the origin specified in your environment variable is allowed.

// ---

// # 9. Now `credentials: true`

// This is another very important part.

// ```js
// credentials: true
// ```

// allows cross-origin requests to include **credentials**, such as cookies.

// Suppose your backend sets a login cookie:

// ```text
// authToken=abc123
// ```

// Your browser stores that cookie.

// Later your React frontend makes:

// ```js
// fetch("http://localhost:8000/api/profile", {
//     credentials: "include"
// });
// ```

// The browser can send the relevant cookie with the request when the CORS/server configuration allows credentials.

// That's why your backend has:

// ```js
// credentials: true
// ```

// ---

// # 10. There's a connection between frontend and backend settings

// This is important.

// Backend:

// ```js
// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }));
// ```

// Frontend:

// ```js
// fetch("http://localhost:8000/api/profile", {
//     credentials: "include"
// });
// ```

// Both sides are involved.

// ```text
//              REQUEST
// React ──────────────────────→ Express
//       credentials: "include"

//              RESPONSE
// React ←────────────────────── Express
//        Access-Control-Allow-Origin:
//        http://localhost:5173

//        Access-Control-Allow-Credentials:
//        true
// ```

// This allows cookie-based authentication across the two origins.

// ---

// # 11. What is `app.use()` doing?

// You have:

// ```js
// app.use(cors(...));
// ```

// Remember that Express middleware works roughly like:

// ```text
// Incoming request
//        ↓
//     cors()
//        ↓
// Next middleware
//        ↓
// Route
//        ↓
// Response
// ```

// `app.use()` tells Express:

// > Run this middleware for incoming requests.

// So your CORS middleware gets involved in requests to your application and sets the appropriate CORS headers.

// ---

// # 12. What about `cookieParser`?

// You also have:

// ```js
// import cookieParser from "cookie-parser";
// ```

// but you haven't actually used it yet.

// You would normally have:

// ```js
// app.use(cookieParser());
// ```

// `cookie-parser` and CORS are **different things**.

// ### CORS

// Controls whether a browser allows one origin to access another origin's resources.

// ### cookie-parser

// Helps Express read cookies from incoming requests.

// For example, if the browser sends:

// ```http
// Cookie: accessToken=abc123
// ```

// then `cookie-parser` can make it accessible through:

// ```js
// req.cookies.accessToken
// ```

// So:

// ```text
// CORS
//  ↓
// Cross-origin permission

// cookie-parser
//  ↓
// Read cookies
// ```

// ---

// # 13. One common misconception

// CORS is **not really a mechanism that prevents the request from reaching your server**.

// The browser is the important actor.

// For example:

// ```text
// React
//   │
//   │ request
//   ▼
// Express
//   │
//   │ response + CORS headers
//   ▼
// Browser
// ```

// The browser examines the CORS rules and determines whether JavaScript running on the frontend is allowed to access the response.

// That's why you can sometimes see a request in the browser's Network tab even when the browser reports a CORS error.

// ---

// # 14. What is a "preflight" request?

// You'll encounter this soon.

// Sometimes before sending the actual request, the browser sends an `OPTIONS` request.

// For example, your frontend wants:

// ```http
// POST /api/login
// Origin: http://localhost:5173
// Content-Type: application/json
// ```

// The browser may first ask the server:

// ```http
// OPTIONS /api/login
// Origin: http://localhost:5173
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: content-type
// ```

// Basically:

// > "Hey server, will you allow this origin to make this kind of request?"

// The server responds with appropriate CORS headers.

// Then the browser can proceed with the actual request if permitted.

// The `cors` package helps Express handle this CORS machinery.

// ---

// # 15. Your code in plain English

// Your entire code:

// ```js
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));
// ```

// basically means:

// > **"My Express backend accepts cross-origin browser requests from the origin specified in `CORS_ORIGIN`, and it allows credentialed requests such as cookies."**

// For example, if:

// ```env
// CORS_ORIGIN=http://localhost:5173
// ```

// then:

// ```text
// http://localhost:5173
//         ↓
//       allowed
//         ↓
// http://localhost:8000
// ```

// while an unauthorized origin such as:

// ```text
// http://localhost:3000
// ```

// would not be allowed by this CORS configuration.

// ---

// ### One small correction to your current code

// You've imported:

// ```js
// import cookieParser from "cookie-parser";
// ```

// but haven't registered it.

// If your application needs to read cookies, you'll eventually add:

// ```js
// app.use(cookieParser());
// ```

// So your setup might become:

// ```js
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// const app = express();

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));

// app.use(cookieParser());

// export { app };
// ```

// And later you'll likely add things such as:

// ```js
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// ```

// Those are separate middleware with separate purposes.



//MIDDLEWARES OF EXPRESS AND COOKIE-PARSER


//These are all **Express middleware**. They prepare your Express application to understand different kinds of incoming requests and files.

// Your code:

// ```js
// app.use(express.json({ limit: "16kb" }));

// app.use(express.urlencoded({
//     extended: true,
//     limit: "16kb"
// }));

// app.use(express.static("public"));

// app.use(cookieParser());
// ```

// Let's understand each one and, more importantly, **why you need them**.

// ---

// # 1. `express.json({ limit: "16kb" })`

// ```js
// app.use(express.json({ limit: "16kb" }));
// ```

// This tells Express:

// > "If a client sends JSON data in the request body, parse it and make it available through `req.body`."

// ### Without it

// Suppose your frontend sends:

// ```js
// fetch("/api/users", {
//     method: "POST",
//     headers: {
//         "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//         username: "Saksham",
//         age: 20
//     })
// });
// ```

// The request contains:

// ```json
// {
//     "username": "Saksham",
//     "age": 20
// }
// ```

// Without:

// ```js
// app.use(express.json());
// ```

// Express won't automatically parse that JSON body for you.

// ---

// ### With it

// ```js
// app.use(express.json());
// ```

// Express parses the JSON and puts it into:

// ```js
// req.body
// ```

// So your route can do:

// ```js
// app.post("/users", (req, res) => {
//     console.log(req.body);
// });
// ```

// You get:

// ```js
// {
//     username: "Saksham",
//     age: 20
// }
// ```

// So:

// ```text
// JSON request
//      ↓
// express.json()
//      ↓
// JavaScript object
//      ↓
// req.body
// ```

// ---

// ## What does `limit: "16kb"` mean?

// ```js
// express.json({
//     limit: "16kb"
// })
// ```

// means:

// > Don't accept JSON request bodies larger than 16 KB.

// For example:

// ```text
// 5 KB JSON     → ✅
// 10 KB JSON    → ✅
// 16 KB JSON    → ✅
// 50 KB JSON    → ❌
// ```

// This is useful because you don't want someone sending an enormous request body to your server.

// ---

// # 2. `express.urlencoded(...)`

// ```js
// app.use(express.urlencoded({
//     extended: true,
//     limit: "16kb"
// }));
// ```

// This is for a **different format of request body** called URL-encoded form data.

// You'll commonly encounter it with traditional HTML forms.

// For example:

// ```html
// <form method="POST" action="/login">
//     <input name="username">
//     <input name="password">
//     <button type="submit">Login</button>
// </form>
// ```

// When submitted, the browser can send something like:

// ```text
// username=Saksham&password=12345
// ```

// That's called:

// ```text
// application/x-www-form-urlencoded
// ```

// Express can parse it using:

// ```js
// express.urlencoded()
// ```

// Then:

// ```js
// app.post("/login", (req, res) => {
//     console.log(req.body);
// });
// ```

// might give:

// ```js
// {
//     username: "Saksham",
//     password: "12345"
// }
// ```

// Again:

// ```text
// form data
//     ↓
// express.urlencoded()
//     ↓
// JavaScript object
//     ↓
// req.body
// ```

// ---

// # 3. What's `extended: true`?

// This part:

// ```js
// extended: true
// ```

// controls how complicated URL-encoded data can be.

// For simple data:

// ```text
// username=Saksham&age=20
// ```

// you'll get:

// ```js
// {
//     username: "Saksham",
//     age: "20"
// }
// ```

// With `extended: true`, Express can handle more complex/nested structures.

// For example, data representing something like:

// ```text
// user[name]=Saksham&user[age]=20
// ```

// can be interpreted as:

// ```js
// {
//     user: {
//         name: "Saksham",
//         age: "20"
//     }
// }
// ```

// You don't need to worry too much about `extended` right now. The important idea is:

// > `extended: true` allows richer/nested URL-encoded data to be parsed.

// ---

// # 4. `limit: "16kb"` again

// Same idea as before:

// ```js
// limit: "16kb"
// ```

// means:

// > Don't accept URL-encoded request bodies larger than 16 KB.

// So you have a size limit on both types:

// ```js
// express.json({
//     limit: "16kb"
// });

// express.urlencoded({
//     extended: true,
//     limit: "16kb"
// });
// ```

// ---

// # 5. `express.static("public")`

// Now this one is different.

// ```js
// app.use(express.static("public"));
// ```

// This tells Express:

// > "Serve files from the `public` directory directly to clients."

// Suppose your project looks like:

// ```text
// project/
// │
// ├── src/
// │   └── index.js
// │
// ├── public/
// │   ├── image.jpg
// │   ├── style.css
// │   └── hello.html
// │
// └── package.json
// ```

// When you write:

// ```js
// app.use(express.static("public"));
// ```

// Express exposes those files.

// For example:

// ```text
// http://localhost:8000/image.jpg
// ```

// can serve:

// ```text
// public/image.jpg
// ```

// Similarly:

// ```text
// http://localhost:8000/hello.html
// ```

// serves:

// ```text
// public/hello.html
// ```

// ---

// ### Why is this useful?

// Imagine your backend needs to provide an uploaded image:

// ```text
// public/uploads/profile.jpg
// ```

// With:

// ```js
// app.use(express.static("public"));
// ```

// the file can be accessed through a URL such as:

// ```text
// /uploads/profile.jpg
// ```

// This is particularly useful for things like:

// * images
// * CSS
// * JavaScript files
// * HTML
// * uploaded public files

// ---

// # 6. `cookieParser()`

// You have:

// ```js
// app.use(cookieParser());
// ```

// This is middleware from the `cookie-parser` package.

// Its job is:

// > Read the cookies sent by the browser and make them easily accessible through `req.cookies`.

// Suppose the browser sends:

// ```http
// Cookie: accessToken=abc123
// ```

// Without `cookie-parser`, you'd have to manually parse the cookie header.

// With:

// ```js
// app.use(cookieParser());
// ```

// you can simply do:

// ```js
// app.get("/profile", (req, res) => {
//     console.log(req.cookies);
// });
// ```

// You'll get something like:

// ```js
// {
//     accessToken: "abc123"
// }
// ```

// Then:

// ```js
// req.cookies.accessToken
// ```

// gives:

// ```text
// abc123
// ```

// This becomes especially useful when you implement **authentication**.

// For example:

// ```text
// User logs in
//       ↓
// Server creates authentication token
//       ↓
// Server puts token in cookie
//       ↓
// Browser stores cookie
//       ↓
// Browser sends cookie with future requests
//       ↓
// cookieParser()
//       ↓
// req.cookies.accessToken
// ```

// ---

// # Putting all four together

// Your Express setup is basically saying:

// ```js
// app.use(express.json({ limit: "16kb" }));

// app.use(express.urlencoded({
//     extended: true,
//     limit: "16kb"
// }));

// app.use(express.static("public"));

// app.use(cookieParser());
// ```

// ### In plain English:

// ```text
// 1. express.json()
//    ↓
//    Understand JSON request bodies

// 2. express.urlencoded()
//    ↓
//    Understand HTML/form URL-encoded bodies

// 3. express.static()
//    ↓
//    Serve files from the public folder

// 4. cookieParser()
//    ↓
//    Read cookies from incoming requests
// ```

// ---

// # A very important distinction

// Notice that **all four are middleware**:

// ```text
// Incoming HTTP request
//         │
//         ▼
// ┌──────────────────────┐
// │      CORS            │
// └──────────────────────┘
//         │
//         ▼
// ┌──────────────────────┐
// │    express.json()    │
// └──────────────────────┘
//         │
//         ▼
// ┌──────────────────────┐
// │ express.urlencoded() │
// └──────────────────────┘
//         │
//         ▼
// ┌──────────────────────┐
// │   express.static()   │
// └──────────────────────┘
//         │
//         ▼
// ┌──────────────────────┐
// │    cookieParser()    │
// └──────────────────────┘
//         │
//         ▼
//       Your route
// ```

// And that's why you see:

// ```js
// app.use(...)
// ```

// over and over.

// `app.use()` essentially tells Express:

// > **"Put this middleware into the request-processing pipeline."**

// The order can matter too. Express processes middleware roughly **in the order you register it**, which becomes important as your backend gets larger.

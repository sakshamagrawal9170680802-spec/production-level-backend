const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))//TO UNDERSTAND THIS NEXT KEYWORD READ FROM LINE 625
    }
}//THIS IS SIMILAR TO BELOW PROMISE ONE BUT IT CAN HANDLE BOTH PROMISE AND NON PROMISE FUNCTION PASSED TO ASYNCHANDLER AS ARGUMENT


export { asyncHandler }




// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


//here example fn can be 
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
//WE HAVE ALREADY STUDIED THAT ASYNC FUNCTION RETURNS A PROMISE SO THIS GETUSES WILL RETURN PROMISE THAT CAN WORK WITH AWAIT OF ASYNCHANDLER IF A ERROR WILL OCCUR IN GETUSERS THEN IT WILL BE CATCHED BY CATCH(ERROR) AND IF SOMETHING WILL BE RETUNED IN GETUSER THEN IT WILL BE RECEIVED IN AWAIT FN(REQ,RES,NEXT)  SEE BELOW CHATGPT FOR MORE INFORMATION


// const asyncHandler=(fn)=>{
//     return (req,res,next)=>{
//         fn(req,res,next).catch((err)=>{
//             res.status(err.code || 500).json({
//                 success: false,
//                 message: err.message
//             })
//         })
//     }
// }
//THIS IS A PROMISE APPROACH OF ABOVE TRY CATCH ON SAME THING BUT WITH PROMISE





// You're very close. The key is to distinguish **a function** from **the Promise returned by that function**.

// ### `getUsers` is a function

// When you write:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
// ```

// `getUsers` itself is still a **function**.

// The fact that it's `async` means:

// > **When I call this function, it will return a Promise.**

// So:

// ```js
// getUsers
// ```

// → function

// but:

// ```js
// getUsers()
// ```

// → Promise

// That's the distinction.

// ---

// ### Think about it like this

// ```js
// const getUsers = async () => {
//     const users = await User.find();
//     return users;
// };
// ```

// There are two different things:

// ```text
// getUsers
//    ↓
// FUNCTION
// ```

// and:

// ```text
// getUsers()
//    ↓
// PROMISE
// ```

// Because `async` functions **always return a Promise**.

// ---

// ### What does `await` do?

// Suppose:

// ```js
// const getUsers = async () => {
//     const users = await User.find();
//     return users;
// };
// ```

// `User.find()` returns a Promise:

// ```text
// User.find()
//     ↓
// Promise
//     ↓
// await
//     ↓
// actual users
// ```

// `await` takes the **result of the Promise** and gives it to you.

// So:

// ```js
// const users = await User.find();
// ```

// means roughly:

// > "Wait for the Promise returned by `User.find()`, and when it fulfills, give me its value."

// But because the **containing function is `async`**, `getUsers()` itself still returns a Promise.

// ---

// ### This is the part that usually causes confusion

// Consider:

// ```js
// const getUsers = async () => {
//     const users = await User.find();
//     return users;
// };
// ```

// Internally:

// ```text
// User.find()
//      ↓
//   Promise
//      ↓
//    await
//      ↓
//  actual users
//      ↓
//  return users
//      ↓
// async function automatically wraps this
//      ↓
//   Promise<users>
// ```

// So if you do:

// ```js
// const result = getUsers();
// ```

// `result` is a Promise.

// Later:

// ```js
// result.then(users => {
//     console.log(users);
// });
// ```

// gets the actual users.

// ---

// ### Why is `getUsers` declared `async`?

// Because you want to use:

// ```js
// await User.find()
// ```

// inside it.

// `await` is normally used inside an `async` function.

// So:

// ```js
// const getUsers = async (req, res) => {
// ```

// means:

// 1. `getUsers` is a **function**.
// 2. Because it is `async`, calling `getUsers()` gives you a **Promise**.
// 3. Inside it, `await` lets you work with the result of another Promise more conveniently.
// 4. Whatever you `return` becomes the fulfillment value of `getUsers()`'s Promise.

// ### One-line rule to remember

// > **`async` describes the function; calling the function produces the Promise.**

// So:

// ```js
// getUsers       // function
// getUsers()     // Promise
// await getUsers() // actual result
// ```

// That's why `asyncHandler(getUsers)` passes the **function** to the wrapper, while:

// ```js
// await fn(req, res, next)
// ```

// **calls that function** and waits for the Promise it returns.


// Yes — you're now asking the **exact right question**. The key is that there are **two different errors** being discussed.

// Your controller:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
// ```

// does **not** need to explicitly `throw error`.

// Why? Because `await` automatically turns a rejected Promise into a thrown error **inside the async function**.

// ### Example

// Suppose:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
// ```

// And `User.find()` fails.

// Conceptually:

// ```text
// User.find()
//     ↓
// Promise rejected
//     ↓
// await sees rejection
//     ↓
// await throws the error
//     ↓
// getUsers() becomes a rejected Promise
//     ↓
// asyncHandler's catch(error)
// ```

// So you don't need:

// ```js
// throw error;
// ```

// inside `getUsers`.

// ---

// ## Your second question is very important

// You said:

// > If I want `const temp = await getUsers()`, then I have to return something in `getUsers`, right?

// **Yes. Exactly.**

// Consider:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
// ```

// There is no `return`.

// Therefore:

// ```js
// const temp = await getUsers();
// ```

// makes:

// ```js
// temp === undefined
// ```

// because an `async` function that reaches the end without returning anything resolves with `undefined`.

// ---

// ### If you want the users as the result:

// You need:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();

//     res.json(users);

//     return users;
// };
// ```

// Now:

// ```js
// const temp = await getUsers(req, res);
// ```

// gives:

// ```js
// temp === users
// ```

// Conceptually:

// ```text
// getUsers()
//     ↓
// Promise
//     ↓
// return users
//     ↓
// Promise fulfills with users
//     ↓
// await
//     ↓
// temp = users
// ```

// ---

// # But there's an important distinction with Express

// Normally your controller isn't being called because **you want its return value**.

// It's being called because it needs to **send an HTTP response**:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();

//     res.json(users);
// };
// ```

// The important result is:

// ```js
// res.json(users);
// ```

// not:

// ```js
// return users;
// ```

// The controller's job is:

// ```text
// Database
//    ↓
// get users
//    ↓
// res.json(users)
//    ↓
// HTTP response → browser
// ```

// So it's perfectly normal for an Express controller to return nothing.

// ---

// # Now see exactly what `asyncHandler` receives

// You have:

// ```js
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         next(error);
//     }
// };
// ```

// Suppose:

// ```js
// const getUsers = async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// };
// ```

// When Express calls the wrapper:

// ```js
// await fn(req, res, next);
// ```

// it effectively does:

// ```js
// await getUsers(req, res, next);
// ```

// Now:

// ### Success

// `getUsers()` finishes without returning anything:

// ```text
// getUsers()
//     ↓
// Promise fulfilled
//     ↓
// value = undefined
//     ↓
// await undefined
//     ↓
// try finishes
// ```

// We don't care about the `undefined`.

// ### Failure

// If:

// ```js
// await User.find();
// ```

// fails:

// ```text
// User.find()
//     ↓
// rejected Promise
//     ↓
// await throws error
//     ↓
// getUsers() becomes rejected
//     ↓
// await fn(...)
//     ↓
// try/catch catches it
//     ↓
// next(error)
// ```

// That's why the controller doesn't need to manually throw anything.

// ---

// # And your `return` idea

// You are correct that:

// ```js
// const getUsers = async () => {
//     const users = await User.find();

//     return users;
// };
// ```

// allows:

// ```js
// const temp = await getUsers();
// ```

// But `return` and `throw` have different meanings:

// ```text
// return users
//      ↓
// successful Promise
//      ↓
// .then(users => ...)
// ```

// while:

// ```text
// throw error
//      ↓
// rejected Promise
//      ↓
// .catch(error => ...)
// ```

// And `await` itself automatically performs the equivalent of the second behavior when the Promise it is waiting for rejects.

// So this:

// ```js
// const getUsers = async () => {
//     const users = await User.find();
//     return users;
// };
// ```

// is conceptually:

// ```text
// User.find()
//     ↓
// Promise
//     ↓
// await
//     ↓
// users
//     ↓
// return users
//     ↓
// getUsers() → Promise<users>
// ```

// Whereas:

// ```js
// const getUsers = async () => {
//     const users = await User.find();
// };
// ```

// is:

// ```text
// User.find()
//     ↓
// Promise
//     ↓
// await
//     ↓
// users
//     ↓
// no return
//     ↓
// getUsers() → Promise<undefined>
// ```

// And if `User.find()` rejects:

// ```text
// User.find()
//     ↓
// rejected Promise
//     ↓
// await throws
//     ↓
// getUsers() → rejected Promise
// ```

// **That's the crucial connection:** an `async` function always returns a Promise, and `await` propagates rejection as an error automatically. You only need `return` when the caller actually needs a successful value from your function.







//CHATGPT
// `next` is a **function provided by Express** to tell Express:

// > **"I'm done with this middleware, move to the next appropriate middleware."**

// In:

// ```js
// .catch((err) => next(err))
// ```

// we are specifically saying:

// > **"An error occurred. Pass this error to Express's error-handling middleware."**

// ---

// ## 1. Where does `next` come from?

// Look at your `asyncHandler`:

// ```js
// const asyncHandler = (fn) => {

//     return (req, res, next) => {

//         Promise.resolve(fn(req, res, next))
//             .catch((err) => next(err));

//     };

// };
// ```

// Express calls the returned function and provides:

// ```text
// (req, res, next)
//    │    │    │
//    │    │    └── function provided by Express
//    │    └─────── response object
//    └──────────── request object
// ```

// So you don't create `next` yourself.

// Express gives it to you.

// ---

// # 2. What does `next()` normally mean?

// Suppose you have:

// ```js
// app.use((req, res, next) => {
//     console.log("Middleware 1");
//     next();
// });

// app.use((req, res, next) => {
//     console.log("Middleware 2");
//     next();
// });

// app.get("/", (req, res) => {
//     res.send("Hello");
// });
// ```

// The flow is:

// ```text
// Request
//    ↓
// Middleware 1
//    ↓
// next()
//    ↓
// Middleware 2
//    ↓
// next()
//    ↓
// Route
//    ↓
// Response
// ```

// So:

// ```js
// next()
// ```

// means:

// > **Continue the Express middleware chain.**

// ---

// # 3. But `next(err)` is different

// Express gives `next()` a special behavior when you pass an argument.

// ```js
// next()
// ```

// means:

// > Continue normally.

// But:

// ```js
// next(err)
// ```

// means:

// > **Something went wrong. Skip normal middleware and go to error-handling middleware.**

// That's exactly why your asyncHandler does:

// ```js
// .catch((err) => next(err))
// ```

// ---

// # 4. Why do we need it in `asyncHandler`?

// Suppose:

// ```js
// const getUser = async (req, res) => {

//     const user = await User.findById(req.params.id);

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     res.json(user);
// };
// ```

// And:

// ```js
// app.get("/users/:id", asyncHandler(getUser));
// ```

// If the user doesn't exist:

// ```text
// getUser()
//    ↓
// throw new ApiError(...)
//    ↓
// Promise rejected
//    ↓
// asyncHandler .catch()
// ```

// Now:

// ```js
// .catch((err) => next(err))
// ```

// runs.

// So:

// ```text
// catch(err)
//     ↓
// next(err)
//     ↓
// Express
//     ↓
// error-handling middleware
// ```

// ---

// # 5. What is error-handling middleware?

// You can define:

// ```js
// app.use((err, req, res, next) => {

//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message
//     });

// });
// ```

// Notice its first parameter is:

// ```js
// err
// ```

// That's how Express knows this is an **error-handling middleware**.

// So when you do:

// ```js
// next(err)
// ```

// Express passes that same error into:

// ```js
// (err, req, res, next)
// ```

// Therefore:

// ```js
// err.statusCode
// ```

// could be:

// ```text
// 404
// ```

// and:

// ```js
// err.message
// ```

// could be:

// ```text
// User not found
// ```

// ---

// # 6. Compare `next()` and `next(err)`

// ### Normal flow

// ```js
// next();
// ```

// ```text
// Middleware A
//      ↓
//   next()
//      ↓
// Middleware B
// ```

// ### Error flow

// ```js
// next(err);
// ```

// ```text
// Middleware A
//      ↓
//  next(err)
//      ↓
// ERROR middleware
// ```

// ---

// ## 7. Why not just send the response inside `.catch()`?

// You could:

// ```js
// .catch((err) => {
//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message
//     });
// });
// ```

// But then every error-handling decision is inside `asyncHandler`.

// With:

// ```js
// .catch((err) => next(err))
// ```

// you're separating responsibilities:

// ```text
// asyncHandler
//      ↓
// "Something failed."
//      ↓
// next(err)
//      ↓
// Central error middleware
//      ↓
// "How should I format this error?"
//      ↓
// send response
// ```

// That's why this pattern is useful in larger Express applications.

// ### In one sentence:

// ```js
// .catch((err) => next(err))
// ```

// means:

// > **"If my controller's Promise rejects, give that error to Express so Express can pass it to the application's error-handling middleware."**

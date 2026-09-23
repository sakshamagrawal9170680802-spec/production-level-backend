class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }

    }
}

export {ApiError}



//CHATGPT
// Yes. This `ApiError` class is a **custom error class** for your backend.

// Its purpose is to let you create errors with extra API-specific information such as:

// * HTTP status code
// * error message
// * validation errors
// * success/failure status
// * stack trace

// Let's understand it from the beginning.

// ---

// # 1. Why create `ApiError`?

// Normally JavaScript gives you:

// ```js
// throw new Error("User not found");
// ```

// The `Error` object mainly gives you things like:

// ```js
// error.message
// error.stack
// ```

// But in an API, you often want more information:

// ```json
// {
//     "success": false,
//     "message": "User not found",
//     "statusCode": 404,
//     "errors": []
// }
// ```

// JavaScript's normal `Error` doesn't have `statusCode` or `success`.

// So we create our own error type:

// ```js
// class ApiError extends Error
// ```

// Now we can do:

// ```js
// throw new ApiError(404, "User not found");
// ```

// ---

// # 2. `class ApiError extends Error`

// ```js
// class ApiError extends Error {
// ```

// This means:

// > `ApiError` is a customized version of JavaScript's built-in `Error`.

// You can think of it like:

// ```text
// Error
//   ↑
//   │ extends
//   │
// ApiError
// ```

// So `ApiError` automatically gets the features of `Error`.

// For example:

// ```js
// const error = new ApiError(404, "User not found");

// console.log(error.message);
// console.log(error.stack);
// ```

// Both work because `ApiError` inherited them from `Error`.

// ---

// # 3. The constructor

// ```js
// constructor(
//     statusCode,
//     message = "Something went wrong",
//     errors = [],
//     stack = ""
// )
// ```

// The constructor runs when you do:

// ```js
// new ApiError(...)
// ```

// It accepts four values.

// ### `statusCode`

// ```js
// statusCode
// ```

// HTTP status code.

// Examples:

// ```text
// 400 → Bad Request
// 401 → Unauthorized
// 403 → Forbidden
// 404 → Not Found
// 500 → Internal Server Error
// ```

// Example:

// ```js
// new ApiError(404)
// ```

// ---

// ### `message`

// ```js
// message = "Something went wrong"
// ```

// The `=` here means **default parameter**.

// If you don't provide a message:

// ```js
// new ApiError(404)
// ```

// then:

// ```js
// message
// ```

// automatically becomes:

// ```text
// Something went wrong
// ```

// If you do:

// ```js
// new ApiError(404, "User not found")
// ```

// then:

// ```text
// message = "User not found"
// ```

// ---

// ### `errors`

// ```js
// errors = []
// ```

// This is generally used for **additional errors**, especially validation errors.

// For example:

// ```js
// [
//     "Email is required",
//     "Password must contain 8 characters"
// ]
// ```

// If you don't provide anything:

// ```js
// errors = []
// ```

// ---

// ### `stack`

// ```js
// stack = ""
// ```

// This allows you to optionally provide your own stack trace.

// Normally you don't provide it.

// That's why it defaults to:

// ```js
// ""
// ```

// ---

// # 4. `super(message)`

// ```js
// super(message)
// ```

// This is very important.

// Because:

// ```js
// class ApiError extends Error
// ```

// your class inherits from `Error`.

// `super()` calls the constructor of the parent class (`Error`).

// So:

// ```js
// super(message)
// ```

// is essentially telling JavaScript:

// > "Initialize the parent `Error` object using this message."

// For example:

// ```js
// const error = new ApiError(404, "User not found");
// ```

// Inside:

// ```js
// super(message)
// ```

// becomes approximately:

// ```js
// super("User not found")
// ```

// Therefore:

// ```js
// error.message
// ```

// becomes:

// ```text
// User not found
// ```

// ---

// # 5. `this.statusCode`

// ```js
// this.statusCode = statusCode
// ```

// We're adding our own property.

// For:

// ```js
// const error = new ApiError(404, "User not found");
// ```

// we get:

// ```js
// error.statusCode
// ```

// which is:

// ```text
// 404
// ```

// So now our custom error has information that normal `Error` doesn't necessarily have.

// ---

// # 6. `this.data = null`

// ```js
// this.data = null
// ```

// This creates another property.

// It's often reserved for additional data associated with the error.

// For example, your API response might eventually contain:

// ```json
// {
//     "success": false,
//     "message": "User not found",
//     "data": null
// }
// ```

// The author of this class has decided that error responses will have:

// ```js
// data: null
// ```

// by default.

// ---

// # 7. `this.message = message`

// ```js
// this.message = message
// ```

// You might wonder:

// > Didn't `super(message)` already set `message`?

// Yes.

// Because:

// ```js
// super(message)
// ```

// already initializes the inherited `Error.message`.

// So this line:

// ```js
// this.message = message
// ```

// is technically redundant in this implementation.

// It explicitly makes sure the custom object's `message` property has the supplied value.

// ---

// # 8. `this.success = false`

// ```js
// this.success = false;
// ```

// This is an API-specific property.

// The idea is:

// ```text
// Normal API response:
// success = true

// Error API response:
// success = false
// ```

// So:

// ```js
// const error = new ApiError(404, "User not found");

// console.log(error.success);
// ```

// gives:

// ```text
// false
// ```

// This makes it easy for your API error middleware to generate something like:

// ```json
// {
//     "success": false,
//     "message": "User not found"
// }
// ```

// ---

// # 9. `this.errors = errors`

// ```js
// this.errors = errors
// ```

// This stores additional errors.

// For example:

// ```js
// const error = new ApiError(
//     400,
//     "Validation failed",
//     [
//         "Email is required",
//         "Password is too short"
//     ]
// );
// ```

// Then:

// ```js
// error.errors
// ```

// will contain:

// ```js
// [
//     "Email is required",
//     "Password is too short"
// ]
// ```

// This is especially useful when multiple validation problems occur at once.

// ---

// # 10. The `if (stack)` part

// Now we get to the slightly more advanced part:

// ```js
// if (stack) {
//     this.stack = stack
// } else {
//     Error.captureStackTrace(this, this.constructor)
// }
// ```

// Remember that an `Error` normally has a:

// ```js
// error.stack
// ```

// property.

// It tells you approximately **where the error was created and the path the code took to get there**.

// For example:

// ```text
// Error: User not found
//     at getUser (...)
//     at ...
// ```

// This is extremely useful when debugging.

// ---

// # 11. What does `if (stack)` mean?

// ```js
// if (stack)
// ```

// means:

// > "Did the caller provide a stack value?"

// If someone does:

// ```js
// new ApiError(404, "User not found", [], someStack)
// ```

// then `stack` contains something.

// So:

// ```js
// this.stack = stack
// ```

// uses the provided stack.

// ---

// # 12. What if no stack is provided?

// Normally you'll do:

// ```js
// throw new ApiError(404, "User not found");
// ```

// You aren't providing a stack.

// Therefore:

// ```js
// stack = ""
// ```

// and:

// ```js
// if (stack)
// ```

// is false.

// So JavaScript executes:

// ```js
// Error.captureStackTrace(this, this.constructor)
// ```

// ---

// # 13. What is `Error.captureStackTrace()`?

// This is a Node.js/V8 feature that creates a stack trace for the current error object.

// ```js
// Error.captureStackTrace(this, this.constructor)
// ```

// Here:

// ```js
// this
// ```

// means:

// ```text
// the current ApiError object
// ```

// and:

// ```js
// this.constructor
// ```

// refers to:

// ```text
// ApiError
// ```

// So you're basically saying:

// > "Create a stack trace for this `ApiError` object."

// This allows:

// ```js
// error.stack
// ```

// to contain useful debugging information.

// ---

// # 14. Why do we need a custom error at all?

// Now let's connect this with the `asyncHandler` you just learned.

// Suppose you have:

// ```js
// const getUser = async (req, res) => {

//     const user = await User.findById(req.params.id);

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     res.json({
//         success: true,
//         data: user
//     });
// };
// ```

// Notice:

// ```js
// throw new ApiError(404, "User not found");
// ```

// Instead of:

// ```js
// throw new Error("User not found");
// ```

// Now your error contains:

// ```js
// error.statusCode   // 404
// error.message      // "User not found"
// error.success      // false
// error.errors       // []
// error.stack        // stack trace
// ```

// ---

// # 15. Then `asyncHandler` catches it

// Remember your:

// ```js
// const asyncHandler = (fn) => {

//     return (req, res, next) => {

//         Promise.resolve(fn(req, res, next))
//             .catch((err) => next(err));

//     };

// };
// ```

// If this happens:

// ```js
// throw new ApiError(404, "User not found");
// ```

// the Promise becomes rejected.

// Then:

// ```js
// .catch((err) => next(err))
// ```

// receives your `ApiError`.

// So:

// ```text
// getUser()
//    ↓
// throw new ApiError(...)
//    ↓
// Promise rejected
//    ↓
// asyncHandler
//    ↓
// .catch(err)
//    ↓
// next(err)
//    ↓
// Express error middleware
// ```

// ---

// # 16. Your error middleware can now use the properties

// For example:

// ```js
// app.use((err, req, res, next) => {

//     res.status(err.statusCode || 500).json({
//         success: err.success || false,
//         message: err.message || "Something went wrong",
//         errors: err.errors || []
//     });

// });
// ```

// If you throw:

// ```js
// throw new ApiError(404, "User not found");
// ```

// the response can become:

// ```json
// {
//     "success": false,
//     "message": "User not found",
//     "errors": []
// }
// ```

// And the HTTP status will be:

// ```text
// 404
// ```

// ---

// # 17. A complete example

// ### `ApiError.js`

// ```js
// class ApiError extends Error {
//     constructor(
//         statusCode,
//         message = "Something went wrong",
//         errors = [],
//         stack = ""
//     ) {
//         super(message);

//         this.statusCode = statusCode;
//         this.data = null;
//         this.message = message;
//         this.success = false;
//         this.errors = errors;

//         if (stack) {
//             this.stack = stack;
//         } else {
//             Error.captureStackTrace(this, this.constructor);
//         }
//     }
// }

// export { ApiError };
// ```

// ### Controller

// ```js
// const getUser = async (req, res) => {

//     const user = await User.findById(req.params.id);

//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     res.json({
//         success: true,
//         data: user
//     });
// };
// ```

// ### Route

// ```js
// app.get("/users/:id", asyncHandler(getUser));
// ```

// ### Error middleware

// ```js
// app.use((err, req, res, next) => {

//     res.status(err.statusCode || 500).json({
//         success: err.success || false,
//         message: err.message || "Something went wrong",
//         errors: err.errors || []
//     });

// });
// ```

// ---

// # 18. The whole architecture you're building

// You can now see why the tutorial introduced these pieces one after another:

// ```text
//                 HTTP Request
//                      ↓
//                   Express
//                      ↓
//                  Route
//                      ↓
//               asyncHandler
//                      ↓
//                 Controller
//                      ↓
//              Database operation
//                      ↓
//              ┌───────┴───────┐
//              ↓               ↓
//           Success           Error
//              ↓               ↓
//          res.json()    throw ApiError
//                              ↓
//                        Promise rejects
//                              ↓
//                        asyncHandler
//                              ↓
//                          next(error)
//                              ↓
//                    Error Middleware
//                              ↓
//                      JSON error response
// ```

// So **`ApiError` is basically your application's standardized error object**, while **`asyncHandler` catches rejected controller Promises**, and **Express error middleware decides how to send those errors to the client**.

// One small note: `this.message = message` is redundant because `super(message)` already sets the inherited `Error.message`; many tutorials keep it for explicitness.

/**
 * The asyncHandler function is a middleware that wraps an asynchronous request handler and catches any
 * errors that occur during its execution.
 * @param requestHandler - The requestHandler is a function that handles the incoming request and
 * generates a response. It takes three parameters: req (the request object), res (the response
 * object), and next (a function to pass control to the next middleware function).
 * @returns The asyncHandler function returns a middleware function that handles asynchronous request
 * handlers.
 */

const asyncHandler = (requestHandler)=> {
   return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch(
            (err)=>next(err)
        )
    }
}

export {asyncHandler};










// const asyncHandler = (fn) => async(req,res,next) => {

//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         });
//     }
// }
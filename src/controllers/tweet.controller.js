import mongoose, {Types, isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body;
    const UserId = req.user._id;

    if(!content){
        throw new ApiError(400,"content not found");
    }

    const tweet = await Tweet.create({
        content,
        owner:UserId
    })

    if(!tweet){
        throw new ApiError(500,"tweet not created please try again");
    }

    return res.status(200).json(
        new ApiResponse(200,{},"tweet created successfully")
    );
})



const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { UserId } = req.params;

    if(!isValidObjectId(UserId)){
        throw new ApiError(400,"invalid user id");
    }
 
    const user = await User.findOne({_id:UserId});

    if(!user)
    throw new ApiError(400,"user not found");

    const userTweets = await Tweet.find({owner:UserId});

    return res.status(200).json(
        new ApiResponse(200, {userTweets},"user tweet found successfully")
    )
})





const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { newContent } = req.body;
    const UserId = req.user._id;
    const { tweetId } = req.params;

   /* The code snippet `if(isValidObjectId(tweetId)){ throw new ApiError(400,"invalid tweet id"); }` is
   checking if the `tweetId` provided in the request parameters is a valid ObjectId format. In
   MongoDB, ObjectIds are used as unique identifiers for documents in a collection. */
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id");
    }

    /* The code snippet `if(!newContent){ throw new ApiError(400,"new content not found"); }` is
    checking if the `newContent` variable is falsy or not provided in the request body. If the
    `newContent` is not present or falsy, it throws an `ApiError` with a status code of 400 and a
    message indicating that the new content was not found. This is a validation step to ensure that
    the required `newContent` field is provided in the request body before proceeding with updating
    the tweet. */
    if(!newContent){
        throw new ApiError(400,"new content not found");
    }

    //find the tweet in database

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"tweet not found");
    }

    //check owner is valid or not
    
    if(tweet.owner.toString() !== UserId){
        throw new ApiError(403,"you are not allowed to update this tweet");
    }

   /* The code snippet `const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
   {:{content:newContent}}, {new:true});` is updating a tweet document in the database using
   Mongoose's `findByIdAndUpdate` method. */
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
          {$set:{content:newContent}},
          {new:true}
        );

    if(!updatedTweet){
        throw new ApiError(500,"tweet not updated please try again");
    }

    return res.status(200).json(
         new ApiResponse(200,{tweet:updatedTweet},"tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    const UserId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400,"tweet not found");
    }

    if(tweet.owner.toString() !== UserId){
        throw new ApiError(403,"you are not allowed to deleted the tweet");
    }

    const deleteTwet = await Tweet.findByIdAndDelete(tweetId);

    if(!deleteTweet)
    throw new ApiError(500,"tweet npt deleted please try again");

    return res.status(200).json(
        new ApiResponse(200,{},"tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
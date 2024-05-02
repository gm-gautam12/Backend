import mongoose, {Types, isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {

    const {videoId} = req.params;
    //TODO: toggle like on video
    
    const userId = req.user._id;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }

    const video  = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video doesn't exist");
    }

    const videoLike  =await Like.findOne({ video:videoId });

    let like;
    let unlike;

    if(videoLike){
        unlike = await Like.deleteOne({video:videoId});
    }else{
        like = await Like.create({
            video:videoId,
            owner:userId
        });
    }

    return res.status(200).json(
        new ApiResponse(200,{},`video ${unlike ? "unliked" : "liked"} successfully`)
    );

})

const toggleCommentLike = asyncHandler(async (req, res) => {

    //TODO: toggle like on comment
    const {commentId} = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid commentId");
    }

    const comment  =await Comment.findbyId(commentId);

    if(!comment){
        throw new ApiError(404,"comment not found");
    }

    const commentLike = await Comment.findOne({comment:commentId});

    let like;
    let unlike;

    if(commentLike){
        unlike = await Comment.deleteOne({comment:commentId});
    }
    else{
        like = await Comment.create({
            comment:commentId,
            owner:userId
        })
    }

    return res.status(200).json(
        new ApiResponse(200, {}, `comment ${unlike ? "unliked": "liked"} succesfully`)
    );

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet

    const {tweetId} = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(tweetId))
    throw new ApiError(400,"invalid tweetId");

    const tweet = await Tweet.findById(tweetId);

    if(!tweet)
    throw new ApiError(404,"tweet not found");

    const tweetLike = await Tweet.findOne({ tweet:tweetId });

    let like;
    let unlike;

    if(tweetLike)
    unlike = await Tweet.deleteOne({ tweet:tweetId });
    else{
        like = await Tweet.create({
            tweet:tweetId,
            owner:userId
        })
    }

    return res.status(200).json(
        new ApiResponse(200, {}, `tweet ${unlike ? "unliked" : "liked"} successfully`)
    )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id;

    const likes = await Like.aggregate([
        {
            $match:{
                owner:new Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localFiled:"video",
                foreignFiels:"_id",
                as:"likedvideo",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localFiled:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        avatar:1,
                                        usernname:1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addfields:{
                owner:{
                    $first: "$owner"
                }
            }
        }
    ])


    return res.status(200).json(
        new ApiResponse(200, {likedvideo: likes[0]?.likedvideo || {} }, "liked videos found successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
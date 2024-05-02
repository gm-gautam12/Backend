import mongoose, { Types, isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";



const getVideoComments = asyncHandler(async(req,res) => {
    //TODO: get all comment for a video

    const {videoId} = req.params;
    const {page=1,limit=10} = req.body;

    if(!isValidObjectId(videoId))
    throw new ApiError(400,"invalid videoId");

    const aggregate = Comment.aggregate([
        {
            $match:{
                owner:new Types.ObjectId(videoId)
            }
        }
    ])

    Comment.aggregatePaginate(aggregate,{page,limit})
    .then(function (result){
        return res.status(200).json(
            new ApiResponse(200, {result}, "videoComment fetched Successfully")
        )
    })
    .catch(function (error){
        throw error;
    })
    
})


const addComment = asyncHandler(async(req,res) => {
    // TODO: add a comment to a video
    const {videoId} = req.query;
    const {content} = req.body;
    const userId = req.user._id;

    if(!content)
    throw new ApiError(400,"content not found");

    if(!isValidObjectId(videoId))
    throw new ApiError(400,"videoId not found");

    const video = await Video.findById(videoId);

    if(!video)
    throw new ApiError(400,"video not found");

    const comment  = await Comment.create({
        content,
        owner:userId,
        video:videoId
    })

    return res.status(200).json(
        new ApiResponse(200,{comment}, "comment added successfully")
    )

})

const updateComment = asyncHandler(async(req,res) => {
    // TODO: update a comment

    const {commentId} = req.params;
    const {newContent} = req.body;
    const userId = req.user._id;

    if(!isValidObjectId(commentId))
    throw new ApiError(400,"Invalid CommentId");

    if(!newContent)
    throw new ApiError(400,"new Content is required");

    const comment = await Comment.findById(commentId);

    if(!comment)
    throw new ApiError(404,"comment not found");

    if(Comment.owner.toString() !== userId)
    throw new ApiError(401,"you do not have the permission to update the comment");

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
    {
        $set:{
            content:newContent
        }
    },
    {
        new:true
    })

    if(!updatedComment)
    throw new ApiError(500,"something went wrong while updating comment please try again");

    return res.status(200).json(
        new ApiError(200,{ updatedComment },"comment Updated successfully")
    )

})

const deleteComment = asyncHandler(async(req,res) => {
    // TODO: delete a comment

    const { commentId } = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(commentId))
    throw new ApiError(400,"invalid commentid");

    const comment = await Comment.findById(commentId);

    if(!comment)
    throw new ApiError(404,"comment not found");

    if(comment.owner.toString() !== userId)
    throw new ApiError(403,"you do not hsve the permission to modify comment");

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment)
    throw new ApiError(500,"something went wrong while deleting comment");

    return res.status(200).json(
        new ApiResponse(200, {},"comment deleted successfully")
    )

})


export { getVideoComments,addComment,updateComment,deleteComment };
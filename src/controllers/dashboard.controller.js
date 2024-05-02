import mongoose, { Types } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const getChannelStats = asyncHandler(async(req,res) => {
     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

     const userId = req.user._id;

     const totalVideoViews = await Video.aggregate([
          {
               $match:{
                    owner: new Types.ObjectId(userId)
               }
          },
          {
               $group:{
                    _id:null,
                    totalVideoViews:{$sum: "$views"}
               }
          }
     ]);

     const totalSubscribers = await Subscription.aggregate([
          {
               $match:{
                    channel:new Types.ObjectId(userId)
               }
          },
          {
               $count: "totalVideosCount"
          }
     ]);

     const totalLikes = await Like.aggregate([
          {

               $match:{
                    owner:new Types.ObjectId(userId)
               }
          },
          {
               $group:{
                    _id:null,
                    totalVideoLikes : {
                         $sum:{
                              $cond:[
                                   {$ifNull: ["$video",false]},
                                   1,
                                   0
                              ]
                         }
                    },
                     totalTweetLikes:{
                         $sum:{
                              $cond:[
                                   {$ifNull:["$tweet,false"]},
                                   1,
                                   0
                              ]
                         }
                     }
               }
          }
     ]);

     const stats = {
          totalVideoViews : totalVideoViews[0]?.totalVideoViews || 0,
          totalSubscribers : totalSubscribers[0]?.totalSubscribers || 0,
          totalVideos : totalVideos[0]?.totalVideosCount || 0,
          totalLikes : totalLikes[0]
     }


     return res.status(200).json(
          new ApiResponse(200, {stats}, "channel stats fetched successfully")
     )
})

const getChannelVideos = asyncHandler(async(req,res) => {
     // TODO: Get all the videos uploaded by the channel

     const userId = req.user._id;

     const videos = await Video.find({owner:userId});

     return res.status(200).json(
          new ApiResponse(200, {videos}, "channel videos fetched successfully")
     )
})

export { getChannelStats,getChannelVideos };
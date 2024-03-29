import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params;
    const {userId} = req.user._id;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id");
    }

    const channel = await User.findById(channelId);

    if(!channel)
    throw new ApiError(404,"channel not found please provide valid channel id");

    if(channelId.toString() === userId)
    throw new ApiError(400,"you can't subscribe to your own channel");


    const subscription = await Subscription.findOne({ channel:channelId });

    let unSubscribe;
    let subscribe;

/* This block of code is responsible for toggling the subscription status for a user to a specific
channel. Here's a breakdown of what it does: */

    if(subscription?.subscriber?.toString() === userId){
        
        // already subscribe so toggle the status of subscription
        unSubscribe = await Subscription.findOneAndDelete({
            channel:channelId,
            subsciber: userId
        })
    }
    else{
        //subscribe to the channel

        subscribe = await Subscription.create({
            channel:channelId,
            subscriber:userId
        })
    }


    return res.status(200).json(
        new ApiResponse(200, {}, "subscrition toggled successfully")
    )

})




// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid channel id");
    }

    const channel = await User.findById(channelId);

    if(!channel){
        throw new ApiError(404,"channel not found please try again with valid channel id");
    }

    const subscription = await Subscription.aggregate([
        {
            $match: {
                channel:new Types.ObjectId(channelId)
            }
        },

        {
            lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberLists",
                pipeLine: [
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
    
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberLists:{
                    $first:"$subscriberLists"
                }
            }
        }
    ])


    return res.status(200).json(
        new ApiResponse(200,{subscriberLists:subscription[0]?.subscriberLists || []},
            "subscriber list of the channel fetched successfully",)
    )


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"invalid user id");
    }

    const subscriber = await user.findById(subscriberId);

    if(!subscriber)
    throw new ApiError(404,"subscriber not found");

/* This block of code is using the Mongoose aggregation framework to perform a series of operations on
the `Subscription` collection. Here's a breakdown of what each stage is doing: */

    const subscription = await Subscription.aggregate([
        {
            $match:{
                subscriber:newTypes.OnjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannelLists",
                pipeLine:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
          $addFields:{
            subscribedChannelLists:{
                $first:"$subscribedChannelLists"
            }

          }  
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,{subscribedChannelLists:subscription[0]?.subscribedChannelLists || []}, "subscribed channel list fetched successfully",)
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
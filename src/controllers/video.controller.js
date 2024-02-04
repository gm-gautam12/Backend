import mongoose, {Types, isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    const pipeline = [];

    if(!isValidObjectId(userId))
    throw new ApiError(400,"invalid userId");

    const user = await User.findById(userId);

    if(!user)
    throw new ApiError(404,"user not found");

    if(userId){
        pipeline.push({
            $match:{
                owner:new Types.ObjectId(userId)
            }
        });
    }

     if(query){
        pipeline.push({
            $match:{
                $or:[
                    {
                        title:{
                            $regex:query,
                            $options:"i",
                        },

                    },
                    {
                        description:{
                            $regex:query,
                            $options:"i",
                        },
                    },



                ]
            }
        });
     }

     if(sortBy && sortType){
        const sortTypeValue = sortType === "desc" ? -1 : 1;
        pipeline.push({
            $sort:{
                [sortBy]:sortTypeValue
            }
        });
     }

     pipeline.push({
        $lookup: {
            from : "users",
            localField: "owner",
            foreignField: "_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullName:1,
                        avatar:1,
                    }
                }
            ]
        }
     });

     pipeline.push({
        $addFields:{
            owner:{
                $first:"$owner",
            }
        }
     });

     const aggregate = Video.aggregate(pipeline);

     Video.aggregatePaginate(aggregate,{ page,limit }).
     then((result)=> {
        res.status(200).json(
            new ApiResponse(200,{result},"videos fetched Successfully")
        )
     }).
     catch(function(error){
        throw new ApiError(500,"someting went wrong while loading videos");
     })

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished=true } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if(![title, description].every(Boolean))
    throw new ApiError(400,"all Fields are required");

    const videoLocalPath = req?.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req?.files?.thumbnailFile?.[0]?.path;

    if(!videoLocalPath)
    throw new ApiError(400,"video file is required");

    if(!thumbnailLocalPath)
    throw new ApiError(400,"thumbnail file is required");

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoFile)
    throw new ApiError(500,"something went wrong while uplaoding video");

    if(!thumbnailFile)
    throw new ApiError(500,"something went wrong while uploading thumbnail");

    const video = await Video.create({
        videoFile:{
            key:videoFile?.public_id,
            url:videoFile?.url,
        },
        thumbnailFile:{
            key:thumbnailFile?.public_id,
            url:thumbnailFile?.url,
        },
        title,
        description,
        owner:req.user._id,
        duration:videoFile?.duration,
        isPublished,
    });

    if(!video)
    throw new ApiError(500,"something went wrong while creating video");

    res.status(200).json(
        new ApiResponse(200, { video }, "video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if(!isValidObjectId(videoId))
    throw new ApiError(400,"invalid vidoeId");

    const video = await Video.aggregate([
        {
            $match:{
                _id:new Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            email:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner",
                }
            }
        }

    ]);

    if(!video)
    throw new ApiError(404,"Video not found");

    res.status(200).json(
        new ApiResponse(200, { video} , "video fetched Successfully")
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body;

    if(![title,description].every(Boolean))
    throw new ApiError(404,"all feilds are required");

    if(!isValidObjectId(videoId))
    throw new ApiError(400, "invalid videoId");

    const thumbnailLocalPath =  req.files?.path;

    const oldVideoDetails = await Video.findOne({_id:videoId});

    if(!oldVideoDetails)
    throw new ApiError(404,"video not found");

    if(thumbnailLocalPath)
    await deleteOnCloudinary(oldVideoDetails?.thumbnailFile?.key);

    let thumbnail;
    if(thumbnailLocalPath)
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail && thumbnailLocalPath)
    throw new ApiError(500,"something went wrong while uploading thumbnail, pleasde ry again");

    const updateFields = {
        $set:{
            title,
            description,
        }
    };

    if(thumbnail){
        updateFields.$set.thumbnailFile = {
            key:thumbnail?.public_url,
            url:thumbnail?.url,
        }
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new:true,
        }
    )

    if(!updateVideo)
    throw new ApiError(500,"something went wrong while updating video");


    res.status(200).json(
        new ApiResponse(200, { updateVideo}, "video updated Successfully")
    );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if(!isValidObjectId(videoId))
    throw new ApiError(400,"invalid videoId");

    const video = await Video.findById(videoId);

    if(!video)
    throw new ApiError(404,"video not found");

    if(video.videoFile){
        await deleteOnCloudinary(video.videoFile.key,"video");
    }

    if(video.thumbnail)
    await deleteOnCloudinary(video.thumbnail.key);

    await video.findByIdAndDelete(videoId);

    res.status(200).json(
        new ApiResponse(200, {}, "video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId))
    throw new ApiError(400,"invalid videoId");

    const video =await Video.findById(videoId);

    if(!video)
    throw new ApiError(400,"video not found");

    video.isPublished = !video.isPublished;

    await Video.save();

    res.status(200).json(
        new ApiResponse(200, {},"video publish status updated Successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
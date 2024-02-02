import mongoose, {Types, isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    //TODO: create playlist
    if(!name && !description)
    throw new ApiError(404,"name and description is required");

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id,    
    });

    if(!playlist){
        throw new ApiError(500,"something went wrong while creating playlist");
    }

    return res.status(200).json(
        new ApiResponse(200,createPlaylist,"playlist created successfully")
    );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    //TODO: get user playlists

    if(!isValidObjectId(userId))
    throw new ApiError(404,"Invalid user");
 
    const user = await User.findById(userId);

    if(!user)
    throw new ApiError(404,"invalid userId");

    const playlists = await Playlist.aggregate([

        {
            $match:{
                owner:new Types.ObjectId(userId),
            }
        },

        {
            $lookup:{
                from: "videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline: [
                    {
                    $sort:{
                        crearedAt:-1,
                    }
                  },
                  {
                    $limit:1,
                  },
                  {
                    $project:{
                        thumbnail:1,
                    }
                  }
                ]
            }
        },

        {
            $addFields:{
                playlistThumbnail:{
                    $cond:{
                        if:{$isArray:"$videos"},
                        then:{$first:"$videos.thumbnail"},
                        else:null,
                    }
                }
            }
        },

        {
            $project:{
                name:1,
                description:1,
                playlistThumbnail:1,
            }
        }
    ])

    res.status(200).json(
        new ApiResponse(200,{ playlists },"playlist fetched successfully")
    );

})

const getPlaylistById = asyncHandler(async (req, res) => {

    const {playlistId} = req.params;
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId))
    throw new ApiError(404,"playlist not found or invalid playlist");

    const playlistExists = await Playlist.findById(playlistId);

    if(!playlistExists)
    throw new ApiError(404,"playlist not found");

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id:new Types.ObjectId(playlistId),
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
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
                                        fullName:1,
                                        avatar:1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields:{
                            $owner:{
                                $first:"$owner",
                            },
                        },
                    },
                ],
            },
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
                            fullName:1,
                            avatar:1,
                        },
                    },
                ],
            },
        },
        {
            $addFields:{
                $owner:{
                    $first:"$owner",
                },
            },
        }
    ])

    res.status(200).json(
        new ApiResponse(200,{ playlist: playlist[0] },"playlist fetched successfully")
    );

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
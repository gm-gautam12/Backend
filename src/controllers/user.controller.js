import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

/* The `registerUser` function is an asynchronous function that handles the registration of a user. It
takes in the `req` (request) and `res` (response) parameters. */

const generateAccessAndRefreshTokens = async (userId) => {
       
  try {
    
   const user = await User.findById(userId);
   const accessToken =  user.generateAccessToken();
   const refreshToken =  user.generateRefreshToken();

   user.refreshToken=refreshToken;

   await user.save({ validateBeforeSave:false });
   return {accessToken,refreshToken};

  } catch (error) {
    throw new ApiError(500,"something went wrong while registering user");
  }

}



const registerUser = asyncHandler( async(req,res) => {
    
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username,email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object-create entry in db
    //remove password and refresh toke feild form response
    //check response is coming or not/user created or not
    //return response
    //else return error 

    const {fullName,email,username,password} = req.body;
    // console.log(email);

    //validation
    
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required");
    }

    //check user exist or not

    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    });

    if(existedUser){
        throw new ApiError(409,"user already exist with username or email");
    }

   // console.log(req.body);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    //image validation
    if(!avatarLocalPath)
    throw new ApiError(400,"Avatar image is required");

    //cloudinary upload

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar)
   throw new ApiError(400,"Avatar file is required");


   //connecting to db

   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
   });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"something went wrong while registering please try again!!");
  }

  //sending response

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registerd successfully")
  );

})

const loginUser = asyncHandler(async(req,res) => {
  /*
     req body => data
     username or email 
     find user
     password check
     access and refresh token 
     send cookie
  */
  
     const {username,email,password} = req.body;

     if(!username && !email){
      throw new ApiError(404,"username or email is required");
     }

     const user = await User.findOne({
      $or:[{username},{email}]
     })

     if(!user){
      throw new ApiError(404,"user does not exist");
     }

     const isPasswordValid = await user.isPasswordCorrect(password);

     if(!isPasswordValid){
      throw new ApiError(401,"Invalid login credentials");
     }

    
    const { accessToken,refreshToken } =  await generateAccessAndRefreshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");

    const options = {
      httpOnly:true,
      secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "User Logged In Successfully"
      )
    )


})

/* The `logoutUser` function is responsible for logging out a user. It updates the user's document in
the database by setting the `refreshToken` field to `undefined`. It then clears the `accessToken`
and `refreshToken` cookies from the response, indicating that the user is logged out. Finally, it
returns a JSON response with a success message. */

const logoutUser = asyncHandler(async(req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken:1
      }
    },
    {
      new:true
    }
   )

   const options = {
    httpOnly:true,
    secure:true
  }

  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))

})


const refreshAccessToken = asyncHandler( async(req,res) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorized Access");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id);
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token");
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token expired or used");
    }
   
    const options = {
      httpOnly:true,
      secure:true
    }
  
    const { accessToken,newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
  
  
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("newRefreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken, 
          refreshToken:newRefreshToken
        },
        "Access token refreshed Successfully"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token");
  }

})


const changeCurrentPassword = asyncHandler(async(req,res) => {
  
  const {oldPassword,newPassword} = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave:false});

  return res.status(200).
  json(new ApiResponse(200,{},"Password changed successfully"));

})


const getCurrentUser = asyncHandler(async(req,res) => {
  return res.status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"));
})

const updateAccountDetails = asyncHandler( async(req,res) => {

  const {fullName,email} = req.body;

  if(!fullName || !email)
  throw new ApiError(400,"Both field are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200,user,"Account details update successfully")
  );

})


const updateUserAvatar = asyncHandler(async(req,res)=> {

    const avatarLocalPath = req.file.path;

    if(!avatarLocalPath)
    throw new ApiError(400,"avatar image missing");

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
      throw new ApiError(400,"error while uploading avatar");
    }

   const user =  await User.findByIdAndUpdate(
      req.body?._id,
      {
        $set:{
          avatar : avatar.url
        }
      },
      {new : true}
    ).select("-password");

    return res.status(200).json(
      new ApiResponse(
        200, user,"avatar image update Successfully"
      )
    )

})

const coverImageUpdate = asyncHandler(async(req,res)=> {

  const coverLocalPath = req.file.path;

  if(!coverLocalPath)
  throw new ApiError(400,"cover image missing");

  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if(!coverImage.url){
    throw new ApiError(400,"error while uploading cover image");
  }

 const user =  await User.findByIdAndUpdate(
    req.body?._id,
    {
      $set:{
        cover : coverImage.url
      }
    },
    {new : true}
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200, user,"cover image update Successfully"
    )
  )

})


const getUserChannelProfile = asyncHandler(async(req,res) => {

  const {username} = req.params;

  if(!username?.trim()){
    throw new ApiError(400,"userName is missing");
  }

  const channel = await User.aggregate([
    {
      $match:{
        username : username?.toLowerCase()
      }
    },

    {
      $lookup: {
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },

    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },

    {
      $addFields:{
        subscriberCount:{
          $size: "$subscribers"
        },
        channelSubscribedToCount:{
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id, "$subscriber.subscriber"]},
            then: true,
            else: false,
          }
        }
      }
    },

    {
      $project:{
        fullName:1,
        username:1,
        subscriberCount:1,
        channelSubscribedToCount:1,
        avatar:1,
        coverImage:1,
        email:1,
        isSubscribed:1
      }
    }
  ])
  console.log(channel);

  if(!channel?.length){
    throw new ApiError(404,"channel does not exist");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0],"user Fetched SuccessFully")
  )
})


const getWatchHistory = asyncHandler(async(req,res) => {
   
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline: [
          {
            $lookup:{
              from:"videos",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline: [
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch History fetched successfully"
    )
  )
   
})


export { registerUser,loginUser,logoutUser,refreshAccessToken,
  changeCurrentPassword,getCurrentUser,updateAccountDetails,
  updateUserAvatar,coverImageUpdate,getUserChannelProfile,
  getWatchHistory };
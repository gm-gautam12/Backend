import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export {registerUser};
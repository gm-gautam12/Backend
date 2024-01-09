import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
 

const userSchema  = new Schema({

    username: {
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim:true,
        index:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim:true,
    },
    fullName: {
        type: String,
        required: true,
        trim:true,
        index: true
    },
    avatar: {
        type: String, //cloudinary se aayega
        required: true,
    },
    coverImage: {
        type: String, //cloudinary
    },
    watchHistory: [
        {
            type:Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type:String,
        required: [true,"password is required"]
    },
    refershToken: {
        type:String
    }

},{ timestamps:true });


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next(); //isModified default function h

     this.password = await bcrypt.hash(this.password, 10);
     next();
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
};


userSchema.methods.generateAccessToken = function(){
   return jwt.sign({
        _id: this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
};

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
};

//pre ek middleware h
//yaha hm arrow function use nhi kr rhe h kyuki hme apne data ke context 
//se mtlb h jo arrow function m hme nhi milta

export const User = mongoose.model("User",userSchema);
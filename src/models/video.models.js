import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({

    videoFile: {
        type: String,//cloudinary se aayega
        required: true,
    },
    thumbnail:{
        type: String,//cloudinary se aayega
        required: true,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration: {
        type:Number, //cloudinary se aayega
        requird:true
    },
    views : {
        type:Number,
        defalut:0
    },
    ispublished: { // public ke liye available h ki nhi
        type:Boolean,
        default:true
    },
    owner :{
        type:Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps:true});


videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/**
 * The function `connectDB` connects to a MongoDB database using the provided URI and database name,
 * logging the connection status.
 */

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB
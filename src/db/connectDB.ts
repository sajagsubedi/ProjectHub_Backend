import mongoose from "mongoose";

// connectng to database
const connectDB = async () => {
  // check if MONGO_URI is defined in .env file
  if (!process.env.MONGO_URI) {
    throw new Error(
      "Please define the MONGO_URI environment variable inside .env file"
    );
  }
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `Connected to MONGODB!! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.log("MONGODB connection failed!", err);
    process.exit(1);
  }
};

// export of connectDB function
export default connectDB;

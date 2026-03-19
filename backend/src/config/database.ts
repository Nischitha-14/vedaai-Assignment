import mongoose from "mongoose";

export const connectToDatabase = async (mongoUri: string) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
};

export const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

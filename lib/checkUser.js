import { currentUser } from "@clerk/nextjs/server";
import { db } from "../lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // Check if user already exists in the database
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // Safely extract user information
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const email = user.emailAddresses?.[0]?.emailAddress ?? "";
    const imageUrl = user.imageUrl ?? "";

    // Create new user if not found, default role = USER automatically
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl,
        email,
        // role: "USER", // optional since USER is default
      },
    });

    return newUser;
  } catch (error) {
    console.error("checkUser error:", error);
    return null;
  }
};

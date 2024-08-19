// lib/subscription.ts
import clientPromise from "@/lib/mongodb";

export async function checkAndUpdateSubscription(userId: string) {
  const client = await clientPromise;
  const db = client.db("subData");

  const user = await db.collection('users').findOne({ userId });

  if (user && user.subscriptionExpires && new Date(user.subscriptionExpires) < new Date()) {
    // Update subscription status if expired
    await db.collection('users').updateOne(
      { userId },
      { 
        $set: { 
          isSubscriber: false,
          subscriptionExpires: null
        }
      }
    );
  }

  const updatedUser = await db.collection('users').findOne({ userId });

  return {
    isSubscriber: updatedUser?.isSubscriber || false,
    subscriptionExpires: updatedUser?.subscriptionExpires
  };
}

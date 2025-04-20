import clientPromise from "@/lib/mongodb";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const client = await clientPromise;
  const db = client.db();
  const users = await db.collection("profiles").find({}).toArray();
  const serializableUsers = users.map(user => ({
    ...user,
    _id: user._id.toString(),
  }));
  return <DashboardClient users={serializableUsers} />;
}

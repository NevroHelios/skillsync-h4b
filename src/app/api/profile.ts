import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DB || "defaultDB";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection("users");

      await usersCollection.updateOne(
        { email: req.body.email },
        {
          $set: {
            name: req.body.name,
            bio: req.body.bio,
            photo: req.body.photo,
            linkedin: req.body.linkedin,
            github: req.body.github,
            leetcode: req.body.leetcode,
            geeksforgeeks: req.body.geeksforgeeks,
            certificates: req.body.certificates,
            experiences: req.body.experiences,
            projects: req.body.projects,
            cpProfiles: req.body.cpProfiles,
            skills: req.body.skills,
          },
        },
        { upsert: true }
      );

      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await client.close();
    }
  } else if (req.method === "GET") {
    try {
      const email = req.query.email;
      await client.connect();
      const db = client.db(dbName);
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne({ email });

      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
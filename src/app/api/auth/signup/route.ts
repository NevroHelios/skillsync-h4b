import clientPromise from "@/lib/mongodb";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password required." }), { status: 400 });
  }
  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format." }), { status: 400 });
  }
  // Basic password validation (e.g., minimum length)
  if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters long." }), { status: 400 });
  }

  const client = await clientPromise;
  const users = client.db().collection("users");
  const existing = await users.findOne({ email });
  if (existing) {
    return new Response(JSON.stringify({ error: "User already exists." }), { status: 400 });
  }
  const hashed = await hash(password, 10);

  // Assign role based on email
  let role = "user"; // Default role
  if (email === process.env.ADMIN_EMAIL || email === "admin@admin.com") { // Use environment variable or fallback
    role = "admin";
  } else if (email.endsWith("@hr.com")) { // Example: Assign 'hr' role for specific domain
    role = "hr";
  }

  await users.insertOne({ email, password: hashed, role });
  // Optionally create a basic profile document
  await client.db().collection("profiles").insertOne({ email, name: email.split('@')[0], createdAt: new Date() });

  return new Response(JSON.stringify({ success: true }), { status: 201 });
}

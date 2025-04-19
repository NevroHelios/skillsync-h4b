import clientPromise from "@/lib/mongodb";
import { hash } from "bcryptjs";
import crypto from "crypto"; // Import crypto

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const { token } = params;
  const { password } = await req.json();

  if (!password) {
    return new Response(JSON.stringify({ error: "Password required." }), { status: 400 });
  }
  if (password.length < 6) { // Example: Enforce minimum password length
     return new Response(JSON.stringify({ error: "Password must be at least 6 characters long." }), { status: 400 });
  }

  try {
    // Hash the token received in the URL to match the stored hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const client = await clientPromise;
    const users = client.db().collection("users");

    // Find user by the hashed token and check if it's not expired
    const user = await users.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }, // Check if token is still valid
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid or expired password reset token." }), { status: 400 });
    }

    // Hash the new password
    const newHashedPassword = await hash(password, 10);

    // Update the user's password and remove the reset token fields
    await users.updateOne(
      { _id: user._id },
      {
        $set: { password: newHashedPassword },
        $unset: { passwordResetToken: "", passwordResetExpires: "" }, // Remove token fields
      }
    );

    return new Response(JSON.stringify({ success: true, message: "Password has been reset successfully." }), { status: 200 });

  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
  }
}

import clientPromise from "@/lib/mongodb";
import crypto from "crypto"; // Import crypto for token generation
import { Resend } from 'resend';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email required." }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const users = client.db().collection("users");
    const user = await users.findOne({ email });

    if (user) {
      // Generate a secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set token expiry (e.g., 10 minutes from now)
      const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

      // Update user document with hashed token and expiry
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetToken,
            passwordResetExpires,
          },
        }
      );

      // Construct the reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset/${resetToken}`;

      // Send email using Resend
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link will expire in 10 minutes.</p>`
      });
    }

    // Always return a success message to prevent email enumeration
    return new Response(JSON.stringify({ success: true, message: "If an account with that email exists, a password reset link has been sent." }), { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), { status: 500 });
  }
}

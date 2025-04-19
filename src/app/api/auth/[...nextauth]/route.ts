import NextAuth, { User as NextAuthUser } from "next-auth"; // Import User type
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Extend the default User type to include role and image
interface ExtendedUser extends NextAuthUser {
  role?: string;
  image?: string; // Add image property
  id: string; // Ensure id is part of the user object returned by authorize
}

// Define SessionUser type for consistent usage
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> { // Update return type
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }
        const client = await clientPromise;
        const db = client.db();
        const usersCollection = db.collection("users");
        const profilesCollection = db.collection("profiles"); // Get profiles collection

        const user = await usersCollection.findOne({ email: credentials.email });

        if (user && await compare(credentials.password, user.password)) {
          // Fetch profile to get the photo
          const profile = await profilesCollection.findOne({ email: user.email });

          return {
            id: user._id.toString(), // Ensure id is returned as string
            email: user.email,
            role: user.role || "user",
            image: profile?.photo || null, // Add image from profile photo
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, user object is available
      if (user) {
        token.id = (user as ExtendedUser).id; // Add id to token
        token.role = (user as ExtendedUser).role;
        token.picture = (user as ExtendedUser).image; // Persist image to token
      }
      return token;
    },
    async session({ session, token }) {
      // Add role, image, and id from token to session
      if (session.user) {
        (session.user as SessionUser).id = token.id as string; // Add id to session user
        (session.user as SessionUser).role = token.role as string;
        (session.user as SessionUser).image = token.picture as string; // Add image to session user
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout"
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export async function sendResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'Your App <noreply@yourdomain.com>', // Update sender email if needed
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  });
}
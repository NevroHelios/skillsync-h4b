import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import clientPromise from '@/lib/mongodb';
import { authOptions, SessionUser } from '@/app/api/auth/[...nextauth]/route';

// Helper function to validate Starknet addresses
const isValidStarknetAddress = (address: string): boolean => {
  if (!address) return false;
  // Check if address is all zeros (except 0x prefix)
  const strippedAddress = address.startsWith('0x') ? address.substring(2) : address;
  return strippedAddress.length === 64 && !/^0*$/.test(strippedAddress);
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  const user = (session as any)?.user as SessionUser | undefined;

  // Authentication Check
  if (!session || !user || !user.email) {
    return new Response(JSON.stringify({ error: "Unauthorized: Please sign in." }), { status: 401 });
  }

  try {
    const body = await req.json();
    const { address } = body;

    if (!address) {
      return new Response(JSON.stringify({ error: "Wallet address is required" }), { status: 400 });
    }

    // Validate the address format
    if (!isValidStarknetAddress(address)) {
      return new Response(JSON.stringify({ 
        error: "Invalid StarkNet wallet address format", 
        details: "The address must be a valid StarkNet address (not all zeros)" 
      }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Update the profile with the wallet address using both field names for consistency
    await db.collection('profiles').updateOne(
      { email: user.email },
      { 
        $set: { 
          starknetAddress: address, // This is the field name used in applicant view
          wallet: address          // This is the field name used in other places for compatibility
        } 
      },
      { upsert: true }
    );

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Wallet address saved successfully",
      address
    }));
  } catch (error: any) {
    console.error("Error saving wallet address:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to save wallet address", 
      details: error.message 
    }), { status: 500 });
  }
}
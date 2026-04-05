import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

type Role = "FACULTY" | "STUDENT";

export async function requireRole(roles: Role[]) {
  const session = await auth();
  if (!session) {
    return { 
      error: NextResponse.json({ 
        error: "Unauthenticated" 
      }, 
      { 
        status: 401 
      }) 
    }
  }
  if (!roles.includes(session.user.role as Role)) {
    return { 
      error: NextResponse.json({ 
        error: "Forbidden" 
      }, 
      { 
        status: 403 
      }) 
    }
  }
  return { session }
}

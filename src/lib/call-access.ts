import type { Call, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth-session";

export type CallWithUser = Call & { user: Pick<User, "id" | "email" | "parentId" | "role"> };

export function visibleCallsWhere(session: SessionPayload) {
  if (session.role === "MASTER") {
    return {
      OR: [
        { userId: session.sub },
        { user: { parentId: session.sub } },
      ],
    };
  }
  return { userId: session.sub };
}

export async function getCallIfAccessible(
  callId: string,
  session: SessionPayload
): Promise<CallWithUser | null> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      user: { select: { id: true, email: true, parentId: true, role: true } },
    },
  });
  if (!call) return null;
  if (session.role === "MASTER") {
    if (
      call.userId === session.sub ||
      call.user.parentId === session.sub
    ) {
      return call;
    }
    return null;
  }
  if (call.userId === session.sub) return call;
  return null;
}

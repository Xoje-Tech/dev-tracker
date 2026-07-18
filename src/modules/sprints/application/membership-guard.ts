import type { PrismaClient } from "@prisma/client";
import { SprintForbiddenError } from "@sprints/domain/errors.js";

/**
 * MembershipGuard — verifies the actor (User.id) is a member of the
 * given project. Mirrors MilestoneMembershipGuard exactly so the two
 * modules have parallel authorization primitives.
 *
 * "Project does not exist" and "actor is not a member" collapse into
 * 403 to avoid leaking project existence. Use cases that need to
 * distinguish call verifyProjectExists first.
 */
export class SprintMembershipGuard {
  constructor(private readonly prisma: PrismaClient) {}

  async assertMember(projectId: string, userId: string): Promise<void> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!row) {
      throw new SprintForbiddenError();
    }
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return row !== null;
  }
}
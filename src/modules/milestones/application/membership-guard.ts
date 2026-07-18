import type { PrismaClient } from "@prisma/client";
import { MilestoneForbiddenError } from "@milestones/domain/errors.js";

/**
 * MembershipGuard — verifies the actor (User.id) is a member of the
 * given project. Used by every use case that touches a milestone to
 * enforce the per-project authorization boundary.
 *
 * The check is a direct read of ProjectMember; we use a separate port
 * rather than the ProjectRepository so the milestones module does not
 * have to depend on the projects module. ProjectRepository also exposes
 * `isMember`, but importing it would create a one-way cross-module edge.
 *
 * Status mapping:
 *   - row exists          → return true
 *   - row does not exist  → throw 403 MilestoneForbiddenError
 *
 * Note: "project does not exist" and "actor is not a member" are NOT
 * distinguished here on purpose — collapsing the two into a 403 prevents
 * leaking project existence to outsiders. Use cases that need to
 * distinguish (e.g. to return 404 instead) call `verifyProjectExists`
 * first.
 */
export class MilestoneMembershipGuard {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Throws MilestoneForbiddenError if `userId` is not a member of
   * `projectId`. Returns silently on success.
   */
  async assertMember(projectId: string, userId: string): Promise<void> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!row) {
      throw new MilestoneForbiddenError();
    }
  }

  /**
   * Returns true if `userId` is a member of `projectId`, false otherwise.
   * Does NOT throw — use cases that need to branch on membership (rather
   * than 403 unconditionally) call this.
   */
  async isMember(projectId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return row !== null;
  }
}
// backend/transitions.ts
import { PrismaClient } from "@prisma/client";

export type Role = "claimant" | "guidance_encoder" | "guidance_head" | "school_administrator" | "system_admin" | "student";

export function normalizeRole(role?: string): string {
  if (!role) return "";
  const r = role.toLowerCase().trim();
  if (r === "student" || r === "claimant" || r === "citizen") return "claimant";
  if (r === "guidance_encoder" || r === "encoder") return "guidance_encoder";
  if (r === "guidance_head" || r === "head") return "guidance_head";
  if (r === "school_administrator" || r === "schooladmin" || r === "school_admin") return "school_administrator";
  if (r === "system_admin" || r === "admin" || r === "sysadmin") return "system_admin";
  return r;
}

export interface TransitionResult {
  allowed: boolean;
  statusCode: number;
  error?: string;
  reason?: string;
}

/**
 * Centralized Item Status Transition Validator
 * Enforces the Laguna College Guidance Office Lost & Found Core State Machine:
 *   [intake] -> received -> verified -> published -> claim_pending -> released
 *               |                       ^                 |
 *               |                       +--- (rejection) -+
 *               +--------------------------> donated / disposed / turned_over (after lapsed holding & approval)
 */
export function validateItemTransition(
  currentItem: { id: string; status: string; control_no?: string | null },
  targetStatus: string,
  actor: { userId: string; role: string },
  context: {
    claim?: any;
    dispositionCase?: any;
    hasPassedVerification?: boolean;
    verificationDetails?: any;
  } = {}
): TransitionResult {
  const current = currentItem.status.toLowerCase();
  const target = targetStatus.toLowerCase();
  const role = normalizeRole(actor.role);

  // 1. Conflicting active claim state check
  if (target === "claim_pending" && current === "claim_pending") {
    return {
      allowed: false,
      statusCode: 409,
      error: "Conflict: An active claim is already pending verification for this item. System limits to one active claim per item."
    };
  }

  // 2. Same status is a no-op / redundant transition
  if (current === target) {
    return {
      allowed: false,
      statusCode: 400,
      error: `Redundant transition: Item is already in '${current}' status.`
    };
  }

  // 2. Terminal statuses: Once released or disposed, items cannot transition to any other state
  if (current === "released") {
    return {
      allowed: false,
      statusCode: 409,
      error: `Terminal state violation: Item #${currentItem.id} has already been released to its rightful owner and cannot be transitioned to '${target}'.`
    };
  }
  if (["donated", "disposed", "turned_over"].includes(current)) {
    return {
      allowed: false,
      statusCode: 409,
      error: `Terminal state violation: Item #${currentItem.id} has already undergone final disposition (${current}) and cannot be transitioned to '${target}'.`
    };
  }

  // 3. Rule: received -> verified (Physical Verification)
  if (target === "verified") {
    if (current !== "received") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid status transition: Only items in 'received' stage can be transitioned to 'verified'. Current status: '${current}'.`
      };
    }
    if (!["guidance_encoder", "guidance_head"].includes(role)) {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Only Guidance personnel can perform initial item intake verification. Role '${actor.role}' is not authorized.`
      };
    }
    return { allowed: true, statusCode: 200, reason: "Physical item condition and identifiers verified by Guidance personnel" };
  }

  // 4. Rule: verified -> published (Publication Approval)
  if (target === "published" || target === "available") {
    // A. Reversion from claim_pending (claim rejection)
    if (current === "claim_pending") {
      if (role !== "guidance_head") {
        return {
          allowed: false,
          statusCode: 403,
          error: `Authorization denied: Formal claim decision and catalog reversion requires Guidance Head authorization. Role '${actor.role}' is not authorized.`
        };
      }
      return { allowed: true, statusCode: 200, reason: "Claim rejected; item reverted to published catalog for discovery" };
    }

    // B. First publication from verified
    if (current === "received") {
      return {
        allowed: false,
        statusCode: 400,
        error: "Prerequisite violation: Item cannot be published directly from 'received' status. Intake physical verification must be completed first."
      };
    }
    if (current !== "verified") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid status transition: Cannot publish item from '${current}' status. Must be in 'verified' status.`
      };
    }
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Publishing found items to the school bulletin requires Guidance Head operational approval. Role '${actor.role}' is not authorized.`
      };
    }
    return { allowed: true, statusCode: 200, reason: "Publication approved by Guidance Head" };
  }

  // 5. Rule: published -> claim_pending (Claim Submission)
  if (target === "claim_pending") {
    if (current !== "published" && current !== "available") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid claim state: Only items in 'published' status can receive claim submissions. Current status is '${current}'.`
      };
    }
    return { allowed: true, statusCode: 200, reason: "Claim filed by student; item reserved for verification" };
  }

  // 6. Rule: claim_pending -> released (Physical Handover)
  if (target === "released") {
    if (current !== "claim_pending") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid release state: Items can only be released from 'claim_pending' status with an approved claim. Current status is '${current}'.`
      };
    }
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Physical property release authorization is strictly restricted to Guidance Head. Role '${actor.role}' is not authorized.`
      };
    }
    // Prerequisite: claim must be approved
    if (context.claim && context.claim.status !== "approved") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Prerequisite violation: Cannot release item because associated Claim #${context.claim.id} is in '${context.claim.status}' status (must be 'approved').`
      };
    }
    return { allowed: true, statusCode: 200, reason: "Physical release executed and verified" };
  }

  // 7. Rule: published / uncollected -> donated | disposed | turned_over (Final Disposition)
  if (["donated", "disposed", "turned_over"].includes(target)) {
    if (current === "claim_pending") {
      return {
        allowed: false,
        statusCode: 400,
        error: "Cannot execute disposition: Item currently has an active pending claim under verification."
      };
    }
    if (current === "received" || current === "verified") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Cannot execute disposition on '${current}' item: Intake and holding period process must be completed first.`
      };
    }
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Final property disposition approval is strictly restricted to Guidance Head. Role '${actor.role}' is not authorized.`
      };
    }
    // Prerequisite: Disposition case must exist, be approved, and checklist 100% complete
    const dCase = context.dispositionCase;
    if (!dCase) {
      return {
        allowed: false,
        statusCode: 400,
        error: "Prerequisite violation: No disposition case has been created for this item."
      };
    }
    if (!dCase.checklistCompleted) {
      return {
        allowed: false,
        statusCode: 400,
        error: "Prerequisite violation: Disposition document checklist is incomplete. All 5 mandatory items must be certified."
      };
    }
    if (dCase.status !== "approved") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Prerequisite violation: Disposition case is in '${dCase.status}' status. Official approval from Guidance Head is required.`
      };
    }
    return { allowed: true, statusCode: 200, reason: `Final disposition authorized: ${target}` };
  }

  // Unknown transition
  return {
    allowed: false,
    statusCode: 400,
    error: `Undefined state transition: Cannot transition item from '${current}' to '${target}'.`
  };
}

/**
 * Centralized Claim Transition Validator
 */
export function validateClaimTransition(
  currentClaim: { id: string; status: string; claimantId: string },
  targetStatus: string,
  actor: { userId: string; role: string }
): TransitionResult {
  const current = currentClaim.status.toLowerCase();
  const target = targetStatus.toLowerCase();
  const role = normalizeRole(actor.role);

  if (current === target) {
    return {
      allowed: false,
      statusCode: 400,
      error: `Redundant claim transition: Claim #${currentClaim.id} is already '${current}'.`
    };
  }

  // Terminal claim states
  if (["released", "rejected", "cancelled"].includes(current)) {
    return {
      allowed: false,
      statusCode: 409,
      error: `Terminal claim violation: Claim #${currentClaim.id} is already in terminal state '${current}' and cannot transition to '${target}'.`
    };
  }

  // Claim approval
  if (target === "approved") {
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Formal claim approval is strictly reserved for Guidance Head. Role '${actor.role}' is not authorized.`
      };
    }
    if (!["submitted", "under_verification"].includes(current)) {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid claim transition: Cannot approve claim from '${current}' status.`
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  // Claim rejection
  if (target === "rejected") {
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Formal claim rejection is strictly reserved for Guidance Head. Role '${actor.role}' is not authorized.`
      };
    }
    if (!["submitted", "under_verification"].includes(current)) {
      return {
        allowed: false,
        statusCode: 400,
        error: `Invalid claim transition: Cannot reject claim from '${current}' status.`
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  // Claim release
  if (target === "released") {
    if (role !== "guidance_head") {
      return {
        allowed: false,
        statusCode: 403,
        error: `Authorization denied: Release execution is strictly reserved for Guidance Head. Role '${actor.role}' is not authorized.`
      };
    }
    if (current !== "approved") {
      return {
        allowed: false,
        statusCode: 400,
        error: `Prerequisite violation: Claim must be 'approved' before release. Current status: '${current}'.`
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  // Claim cancellation (by claimant owner)
  if (target === "cancelled") {
    if (currentClaim.claimantId !== actor.userId && role !== "system_admin") {
      return {
        allowed: false,
        statusCode: 403,
        error: "Authorization denied: Only the claimant who filed the claim can cancel it."
      };
    }
    if (!["submitted", "under_verification"].includes(current)) {
      return {
        allowed: false,
        statusCode: 400,
        error: `Cannot cancel claim: Current status is '${current}'.`
      };
    }
    return { allowed: true, statusCode: 200 };
  }

  return {
    allowed: false,
    statusCode: 400,
    error: `Undefined claim transition: Cannot change claim from '${current}' to '${target}'.`
  };
}

/**
 * File Signature (Magic Bytes) Verification
 * Validates actual binary bytes against declared MIME type to prevent disguised executables (.exe, .sh, .elf)
 */
export function verifyFileSignature(
  fileContent: string | Buffer,
  declaredMime: string
): { valid: boolean; error?: string; detectedType?: string } {
  let buf: Buffer;

  if (Buffer.isBuffer(fileContent)) {
    buf = fileContent;
  } else if (typeof fileContent === "string") {
    // If string is data URL or raw base64
    let cleanBase64 = fileContent;
    if (fileContent.includes(",")) {
      cleanBase64 = fileContent.split(",")[1];
    }
    try {
      buf = Buffer.from(cleanBase64.trim(), "base64");
    } catch {
      return { valid: false, error: "Invalid base64 payload." };
    }
  } else {
    return { valid: false, error: "Unsupported file content representation." };
  }

  if (buf.length < 4) {
    return { valid: false, error: "File content is too small to contain a valid header signature." };
  }

  const mime = declaredMime.toLowerCase().trim();

  // Check dangerous executable signatures regardless of declared MIME
  const isExe = buf[0] === 0x4D && buf[1] === 0x5A; // 'MZ' Windows DOS/PE
  const isElf = buf[0] === 0x7F && buf[1] === 0x45 && buf[2] === 0x4C && buf[3] === 0x46; // Linux ELF
  if (isExe || isElf) {
    return {
      valid: false,
      error: "Security violation: Executable binary files (.exe / .elf) are strictly prohibited."
    };
  }

  // 1. PDF signature: %PDF (25 50 44 46)
  if (mime === "application/pdf") {
    const isPdf = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
    if (!isPdf) {
      return {
        valid: false,
        error: "File content signature mismatch: Declared 'application/pdf' does not match binary '%PDF' header."
      };
    }
    return { valid: true, detectedType: "application/pdf" };
  }

  // 2. JPEG signature: FF D8 FF
  if (mime === "image/jpeg" || mime === "image/jpg") {
    const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
    if (!isJpeg) {
      return {
        valid: false,
        error: "File content signature mismatch: Declared 'image/jpeg' does not match binary JPEG header (FF D8 FF)."
      };
    }
    return { valid: true, detectedType: "image/jpeg" };
  }

  // 3. PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (mime === "image/png") {
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    if (!isPng) {
      return {
        valid: false,
        error: "File content signature mismatch: Declared 'image/png' does not match binary PNG header."
      };
    }
    return { valid: true, detectedType: "image/png" };
  }

  // 4. WebP signature: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (mime === "image/webp") {
    const isRiff = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    const isWebp = buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
    if (!isRiff || !isWebp) {
      return {
        valid: false,
        error: "File content signature mismatch: Declared 'image/webp' does not match binary RIFF/WEBP header."
      };
    }
    return { valid: true, detectedType: "image/webp" };
  }

  return {
    valid: false,
    error: `Unsupported MIME type '${mime}'. Permitted types: PDF, JPEG, PNG, WebP.`
  };
}

/**
 * Persistent Audit Logger helper
 */
export async function recordAuditLog(
  prisma: PrismaClient,
  params: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null
      }
    });
  } catch (err: any) {
    console.error("Failed to write persistent audit log:", err?.message || err);
    return null;
  }
}

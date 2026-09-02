import { db } from "@/db";
import { generationRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface GenerationRecord {
  id: number;
  uuid: string;
  user_uuid: string;
  type: string;
  prompt?: string;
  status: 'completed' | 'failed' | 'processing';
  credits_used: number;
  result_url?: string;
  error_message?: string;
  created_at: Date;
  updated_at?: Date;
}

export async function createGenerationRecord(data: {
  user_uuid: string;
  type: string;
  prompt?: string;
  status: 'completed' | 'failed' | 'processing';
  credits_used: number;
  result_url?: string;
  error_message?: string;
}) {
  const [record] = await db()
    .insert(generationRecords)
    .values({
      uuid: crypto.randomUUID(),
      ...data,
    })
    .returning();

  return record;
}

export async function getGenerationRecordsByUser(user_uuid: string) {
  const records = await db()
    .select()
    .from(generationRecords)
    .where(eq(generationRecords.user_uuid, user_uuid))
    .orderBy(desc(generationRecords.created_at));

  return records;
}

export async function updateGenerationRecord(
  uuid: string,
  data: {
    status?: 'completed' | 'failed' | 'processing';
    result_url?: string;
    error_message?: string;
  }
) {
  const [record] = await db()
    .update(generationRecords)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(generationRecords.uuid, uuid))
    .returning();

  return record;
}
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Parameters required to save an infrastructure execution record.
 */
interface SaveParams {
  userId: string;
  type: string;
  description: string;
}

/**
 * Save a new execution record for a user.
 */
export async function saveExecutionResult(params: SaveParams) {
  console.log("[SERVER ACTION] Received request with params:", params);
  const { userId, type, description } = params;

  if (!userId || !description) {
    console.error("[SERVER ACTION] Validation failed: Missing required fields.");
    return { success: false, error: "Missing required fields." };
  }

  const supabase = createSupabaseServerClient();

  try {
    const dataToInsert = {
      user_id: userId,
      type,
      description,
    };

    console.log("[SERVER ACTION] Inserting into 'infrastructure':", dataToInsert);

    const { data, error } = await supabase
      .from("infrastructure")
      .insert(dataToInsert)
      .select() // Trả về bản ghi vừa insert
      .single(); // Lấy 1 object

    console.log("[SERVER ACTION] Supabase response:", { data, error });

    if (error) throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
    if (!data) throw new Error("Data not returned. Check RLS policies.");

    console.log("[SERVER ACTION] Insert successful:", data);
    return { success: true, data };
  } catch (error: any) {
    console.error("[SERVER ACTION] saveExecutionResult error:", error.message);
    return { success: false, error: error.message || "Unknown database error." };
  }
}

/**
 * Fetch all infrastructure history for the current authenticated user.
 */
export async function getInfrastructureHistoryForCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) throw new Error("User is not authenticated.");

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("infrastructure")
    .select("id, type, description, created_at") // bỏ action
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SERVER ACTION] Supabase fetch error:", error.message);
    throw new Error("Could not fetch project history from the database.");
  }

  return data || [];
}

/**
 * Delete an infrastructure record by ID for the current authenticated user.
 */
export async function deleteInfrastructureHistory(id: string) {
  if (!id) return { success: false, error: "Item ID is required." };

  const supabase = createSupabaseServerClient();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) return { success: false, error: "Unauthorized." };

  const { error } = await supabase
    .from("infrastructure")
    .delete()
    .match({ id, user_id: userId });

  if (error) {
    console.error("[SERVER ACTION] Supabase delete error:", error.message);
    return { success: false, error: "Failed to delete item." };
  }

  return { success: true };
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ExecutionResultViewer } from "@/components/ui/execution-result-viewer";
import type { ExecutionResult } from "@/types/data"; 

interface PageProps {
  params: { id: string }; 
}

export default async function ScriptDetailPage({ params }: PageProps) {
  const resolvedParams = await params;  
  const { id } = resolvedParams;

  const supabase = createSupabaseServerClient();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return <DashboardLayout><p>Unauthorized. Please sign in.</p></DashboardLayout>;
  }

  const { data, error } = await supabase
    .from("infrastructure")
    .select("id, type, description, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return <DashboardLayout><p>Error loading script details: {error.message}</p></DashboardLayout>;
  }
  if (!data) {
    return <DashboardLayout><p>Script not found or you do not have permission to view it.</p></DashboardLayout>;
  }

  let executionResult: ExecutionResult | null = null;
  let parseError: string | null = null;
  try {
    if (data.description) {
      executionResult = JSON.parse(data.description);
    }
  } catch (e) {
    console.error("Failed to parse description JSON:", e);
    parseError = "The stored result data is corrupted and cannot be displayed.";
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard/infrastructure"> 
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold capitalize">
              {data.type.replace(/_/g, " ")}
            </CardTitle>
            <CardDescription>
              Execution ID: {data.id}
            </CardDescription>
            <p className="text-sm text-muted-foreground pt-1">
              Executed at: {new Date(data.created_at).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Execution Result</h2>
            {parseError ? (
              <div className="text-red-500 bg-red-50 p-4 rounded-md">{parseError}</div>
            ) : executionResult ? (
              <ExecutionResultViewer result={executionResult} />
            ) : (
              <p className="text-muted-foreground italic">No description data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
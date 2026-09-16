import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DocumentDownloadLink } from "@/components/compliance/document-download-link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const ctx = await requirePermission("documents.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id, file_name, document_type, entity_type, mime_type, file_size, created_at")
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Private repository. Downloads use short-lived signed URLs — files are never public."
      />
      {!data?.length ? (
        <EmptyState title="No documents" description="Upload permits from Compliance or attach files to a board." />
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {data.map((doc) => (
            <li key={doc.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{doc.file_name}</p>
                <p className="text-muted-foreground">
                  {doc.document_type} · {doc.entity_type} · {(doc.file_size / 1024).toFixed(0)} KB
                </p>
              </div>
              <DocumentDownloadLink documentId={doc.id} fileName={doc.file_name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

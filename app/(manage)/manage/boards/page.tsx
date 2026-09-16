import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LifecycleBadge } from "@/components/status/status-badge";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { PlaceFilters } from "@/components/location/place-filters";
import { STRUCTURE_TYPE_LABELS, type BoardLifecycle, type StructureType } from "@/lib/types/enums";

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; district?: string; lifecycle?: string; type?: string; page?: string }>;
}) {
  const ctx = await requirePermission("boards.view");
  const params = await searchParams;
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const supabase = await createClient();

  let query = supabase
    .from("boards")
    .select("id, board_code, name, city, locality, structure_type, lifecycle_status, board_faces(id, archived_at)", {
      count: "exact",
    })
    .eq("tenant_id", ctx.tenantId)
    .order("board_code")
    .range(from, from + pageSize - 1);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,board_code.ilike.%${params.q}%,locality.ilike.%${params.q}%`);
  }
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.district) query = query.ilike("district", `%${params.district}%`);
  if (params.lifecycle) query = query.eq("lifecycle_status", params.lifecycle);
  if (params.type) query = query.eq("structure_type", params.type);

  const { data: boards, count, error } = await query;

  const queryString = (nextPage: number) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.city) search.set("city", params.city);
    if (params.district) search.set("district", params.district);
    if (params.lifecycle) search.set("lifecycle", params.lifecycle);
    if (params.type) search.set("type", params.type);
    search.set("page", String(nextPage));
    return `?${search.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boards"
        description="Physical structures. Faces are the sellable units."
        actions={
          can(ctx, "boards.create") ? (
            <Link href="/manage/boards/new" className={cn(buttonVariants())}>
              Add board
            </Link>
          ) : null
        }
      />

      <form className="flex flex-wrap gap-2">
        <Input name="q" placeholder="Search code, name, locality" defaultValue={params.q} className="max-w-xs" />
        <PlaceFilters district={params.district} city={params.city} />
        <select name="lifecycle" defaultValue={params.lifecycle ?? ""} className="h360-select">
          <option value="">All lifecycles</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="blocked">Blocked</option>
          <option value="retired">Retired</option>
        </select>
        <select name="type" defaultValue={params.type ?? ""} className="h360-select">
          <option value="">All structures</option>
          {Object.entries(STRUCTURE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className={cn(buttonVariants({ variant: "outline" }))} type="submit">
          Filter
        </button>
      </form>

      {error ? (
        <EmptyState title="Could not load boards" description="Try refreshing the page." />
      ) : !boards?.length ? (
        <EmptyState
          title={params.q || params.city || params.lifecycle || params.type ? "No boards match these filters." : "Your inventory starts here."}
          description={
            params.q || params.city || params.lifecycle || params.type
              ? "Adjust filters or clear search to see more inventory."
              : "Add the physical structure first. Faces are what you sell."
          }
          actionHref={can(ctx, "boards.create") ? "/manage/boards/new" : undefined}
          actionLabel={can(ctx, "boards.create") ? "Add board" : undefined}
        />
      ) : (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Faces</TableHead>
                <TableHead>Lifecycle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boards.map((board) => {
                const activeFaces = (board.board_faces ?? []).filter((face) => !face.archived_at).length;
                return (
                  <TableRow key={board.id}>
                    <TableCell className="font-mono text-xs">{board.board_code}</TableCell>
                    <TableCell>
                      <Link href={`/manage/boards/${board.id}`} className="font-medium hover:underline">
                        {board.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {STRUCTURE_TYPE_LABELS[board.structure_type as StructureType] ?? board.structure_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {board.locality ? `${board.locality}, ` : ""}
                      {board.city}
                    </TableCell>
                    <TableCell>{activeFaces}</TableCell>
                    <TableCell>
                      <LifecycleBadge value={board.lifecycle_status as BoardLifecycle} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
      )}

      {count && count > pageSize ? (
        <div className="flex gap-2 text-sm">
          {page > 1 ? (
            <Link href={queryString(page - 1)} className="underline">
              Previous
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            Page {page} of {Math.ceil(count / pageSize)}
          </span>
          {from + pageSize < count ? (
            <Link href={queryString(page + 1)} className="underline">
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

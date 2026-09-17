import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PropertyList } from "@/components/property-list";
import { DisclosurePanel } from "@/components/disclosure-panel";
import { MapViewLazy } from "@/components/maps/map-view-lazy";
import { StatusCluster } from "@/components/status/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/catalog";
import { boardComplianceStatus } from "@/lib/compliance/board-compliance";
import { faceOccupancyDimension, summarizeOccupancyDimensions } from "@/lib/occupancy/status";
import { BoardQr } from "@/components/boards/board-qr";
import { BoardEditForm } from "@/components/boards/board-edit-form";
import { FaceForm } from "@/components/boards/face-form";
import {
  ILLUMINATION_LABELS,
  STRUCTURE_TYPE_LABELS,
  type BoardLifecycle,
  type IlluminationType,
  type OccupancyState,
  type OwnershipType,
  type StructureType,
} from "@/lib/types/enums";
import { formatFaceIdentity } from "@/lib/boards/format";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const ctx = await requirePermission("boards.view");
  const { boardId } = await params;
  const supabase = await createClient();
  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (!board) notFound();

  const { data: faces } = await supabase
    .from("board_faces")
    .select("*")
    .eq("board_id", boardId)
    .order("face_label");

  const entityIds = [boardId, ...(faces ?? []).map((face) => face.id)];
  const { data: activity } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .eq("tenant_id", ctx.tenantId)
    .in("entity_id", entityIds)
    .order("created_at", { ascending: false })
    .limit(30);

  const activeFaces = (faces ?? []).filter((face) => !face.archived_at);
  const archivedFaces = (faces ?? []).filter((face) => face.archived_at);
  const faceIds = activeFaces.map((face) => face.id);

  const [{ data: occupancyRows }, compliance] = await Promise.all([
    faceIds.length
      ? supabase
          .from("occupancy_periods")
          .select("id, face_id, start_date, end_date, state")
          .in("face_id", faceIds)
          .eq("tenant_id", ctx.tenantId)
      : Promise.resolve({ data: [] as Array<{ id: string; face_id: string; start_date: string; end_date: string; state: OccupancyState }> }),
    boardComplianceStatus(supabase, boardId),
  ]);

  const occupancyByFace = new Map<string, Array<{ id: string; start_date: string; end_date: string; state: OccupancyState }>>();
  for (const id of faceIds) occupancyByFace.set(id, []);
  for (const row of occupancyRows ?? []) {
    occupancyByFace.get(row.face_id)?.push({
      id: row.id,
      start_date: row.start_date,
      end_date: row.end_date,
      state: row.state as OccupancyState,
    });
  }
  const occupancyDimensions = faceIds.map((id) => faceOccupancyDimension(occupancyByFace.get(id) ?? []));
  const occupancySummary = summarizeOccupancyDimensions(occupancyDimensions);

  return (
    <div className="h360-stack">
      <PageHeader
        eyebrow={board.board_code}
        title={board.name}
        description={[...new Set([board.locality, board.city, board.district].filter(Boolean))].join(" · ")}
        meta={
          <StatusCluster
            lifecycle={board.lifecycle_status as BoardLifecycle}
            compliance={compliance}
            occupancy={occupancySummary}
          />
        }
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faces">Faces</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="h360-panel p-5">
              <h2 className="mb-4 text-sm font-medium">Structure</h2>
              <PropertyList
                items={[
                  { label: "Type", value: STRUCTURE_TYPE_LABELS[board.structure_type as StructureType] },
                  {
                    label: "Ownership",
                    value: board.ownership_type.replace("_", " "),
                  },
                  { label: "Active faces", value: String(activeFaces.length) },
                  { label: "Landmark", value: board.landmark },
                  { label: "Address", value: board.address },
                  { label: "Pincode", value: board.pincode },
                ]}
              />
              {board.description ? (
                <p className="mt-4 text-sm text-muted-foreground">{board.description}</p>
              ) : null}
            </div>
            <div className="h360-panel p-5">
              <h2 className="mb-4 text-sm font-medium">QR identifier</h2>
              <BoardQr slug={board.qr_slug} />
              <p className="mt-3 text-xs text-muted-foreground">Lookup only — not authentication.</p>
            </div>
          </div>

          {can(ctx, "boards.update") ? (
            <DisclosurePanel title="Edit board">
              <BoardEditForm
                board={{
                  id: board.id,
                  board_code: board.board_code,
                  name: board.name,
                  description: board.description,
                  structure_type: board.structure_type as StructureType,
                  ownership_type: board.ownership_type as OwnershipType,
                  lifecycle_status: board.lifecycle_status as BoardLifecycle,
                  address: board.address,
                  locality: board.locality,
                  city: board.city,
                  district: board.district,
                  state: board.state,
                  pincode: board.pincode,
                  landmark: board.landmark,
                  latitude: board.latitude,
                  longitude: board.longitude,
                }}
                canRetire={can(ctx, "boards.update")}
              />
            </DisclosurePanel>
          ) : null}
        </TabsContent>

        <TabsContent value="faces" className="space-y-6 pt-6">
          {!activeFaces.length ? (
            <EmptyState title="No active faces" description="Add independently sellable faces to this board." />
          ) : (
            <div className="space-y-4">
              {activeFaces.map((face) => (
                <Card key={face.id}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      {formatFaceIdentity({ boardName: board.name, faceLabel: face.face_label })}
                      <span className="text-sm font-normal text-muted-foreground">
                        {face.width} × {face.height} ft · {Number(face.area_sqft).toLocaleString("en-IN")} sqft
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      {face.direction || "Direction unset"} ·{" "}
                      {ILLUMINATION_LABELS[face.illumination as IlluminationType]}
                    </div>
                    <div>
                      Card rate:{" "}
                      {face.card_rate != null ? `₹${Number(face.card_rate).toLocaleString("en-IN")}/month` : "—"}
                      {face.floor_rate != null
                        ? ` · Floor ₹${Number(face.floor_rate).toLocaleString("en-IN")}/month`
                        : ""}
                    </div>
                    <FaceForm
                      boardId={board.id}
                      face={{
                        id: face.id,
                        face_label: face.face_label,
                        direction: face.direction,
                        width: Number(face.width),
                        height: Number(face.height),
                        illumination: face.illumination as IlluminationType,
                        card_rate: face.card_rate != null ? Number(face.card_rate) : null,
                        floor_rate: face.floor_rate != null ? Number(face.floor_rate) : null,
                        publishable: face.publishable,
                        marketplace_visible: face.marketplace_visible,
                        archived_at: face.archived_at,
                      }}
                      canEdit={can(ctx, "faces.update")}
                      canArchive={can(ctx, "faces.delete")}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {can(ctx, "faces.create") ? (
            <DisclosurePanel title="Add face">
              <FaceForm boardId={board.id} canEdit={can(ctx, "faces.create")} canArchive={false} />
            </DisclosurePanel>
          ) : null}

          {archivedFaces.length ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Archived faces</h3>
              {archivedFaces.map((face) => (
                <FaceForm
                  key={face.id}
                  boardId={board.id}
                  face={{
                    id: face.id,
                    face_label: face.face_label,
                    direction: face.direction,
                    width: Number(face.width),
                    height: Number(face.height),
                    illumination: face.illumination as IlluminationType,
                    card_rate: face.card_rate != null ? Number(face.card_rate) : null,
                    floor_rate: face.floor_rate != null ? Number(face.floor_rate) : null,
                    publishable: face.publishable,
                    marketplace_visible: face.marketplace_visible,
                    archived_at: face.archived_at,
                  }}
                  canEdit={can(ctx, "faces.update")}
                  canArchive={can(ctx, "faces.delete") || can(ctx, "faces.update")}
                />
              ))}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="location" className="space-y-6 pt-6">
          <div className="h360-panel p-5">
            <PropertyList
              items={[
                { label: "Address", value: board.address },
                { label: "Locality", value: board.locality },
                { label: "City", value: board.city },
                { label: "District", value: board.district },
                { label: "State", value: board.state },
                { label: "Pincode", value: board.pincode },
                { label: "Landmark", value: board.landmark },
                {
                  label: "Coordinates",
                  value:
                    board.latitude != null && board.longitude != null
                      ? `${Number(board.latitude).toFixed(5)}, ${Number(board.longitude).toFixed(5)}`
                      : null,
                },
              ]}
            />
          </div>
          {board.latitude && board.longitude ? (
            <MapViewLazy
              markers={[
                {
                  id: board.id,
                  lat: Number(board.latitude),
                  lng: Number(board.longitude),
                  title: board.name,
                },
              ]}
              center={{ lat: Number(board.latitude), lng: Number(board.longitude) }}
              zoom={14}
              className="h-[28rem]"
            />
          ) : (
            <EmptyState
              title="No location yet"
              description="Set coordinates on the Overview form so field teams and the marketplace can find this board."
            />
          )}
        </TabsContent>

        <TabsContent value="activity" className="pt-6">
          {!activity?.length ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="h360-panel divide-y text-sm">
              {activity.map((row) => (
                <li key={row.id} className="px-4 py-3">
                  <span className="font-medium">{row.action}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {row.entity_type} · {new Date(row.created_at).toLocaleString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

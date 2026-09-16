import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadEnv } from "vite";
import { publicEnvSchema } from "@/lib/env";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || "maplibre",
});

const TENANT_A = "aaaaaaaa-0000-4000-8000-000000000001";
const BOARD_A = "bbbbbbbb-0000-4000-8000-000000000001";
const BOARD_B = "bbbbbbbb-0000-4000-8000-000000000015";
const PASSWORD = "Password123!";
const configured = parsed.success;

async function signIn(email: string): Promise<SupabaseClient> {
  if (!parsed.success) throw new Error("Missing public Supabase env");
  const supabase = createClient(parsed.data.NEXT_PUBLIC_SUPABASE_URL, parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return supabase;
}

describe.skipIf(!configured)("board and face inventory RLS", () => {
  const clients: SupabaseClient[] = [];
  let ownerA: SupabaseClient;
  let ownerB: SupabaseClient;
  let sales: SupabaseClient;
  let technician: SupabaseClient;

  beforeAll(async () => {
    ownerA = await signIn("owner@horizonoutdoor.com");
    ownerB = await signIn("owner@malabarmedia.com");
    sales = await signIn("sales@horizonoutdoor.com");
    technician = await signIn("tech@horizonoutdoor.com");
    clients.push(ownerA, ownerB, sales, technician);
  }, 60_000);

  afterAll(async () => {
    await Promise.all(clients.map((client) => client.auth.signOut()));
  });

  it("lets an owner read boards in their tenant", async () => {
    const { data, error } = await ownerA.from("boards").select("id, tenant_id").eq("id", BOARD_A);
    expect(error).toBeNull();
    expect(data).toEqual([{ id: BOARD_A, tenant_id: TENANT_A }]);
  });

  it("denies reading another tenant board even with a known UUID", async () => {
    const { data } = await ownerA.from("boards").select("id").eq("id", BOARD_B);
    expect(data ?? []).toEqual([]);

    const { data: reverse } = await ownerB.from("boards").select("id").eq("id", BOARD_A);
    expect(reverse ?? []).toEqual([]);
  });

  it("scopes faces to the caller's tenant", async () => {
    const { data } = await ownerA.from("board_faces").select("id, tenant_id, board_id").eq("board_id", BOARD_A);
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((row) => row.tenant_id === TENANT_A)).toBe(true);

    const { data: leaked } = await ownerA.from("board_faces").select("id").eq("board_id", BOARD_B);
    expect(leaked ?? []).toEqual([]);
  });

  it("rejects board creation from sales", async () => {
    const { data, error } = await sales
      .from("boards")
      .insert({
        tenant_id: TENANT_A,
        board_code: "H360-TEST-SALES",
        name: "Sales should not create",
        structure_type: "hoarding",
        ownership_type: "owned",
        lifecycle_status: "draft",
        city: "Palakkad",
        state: "Kerala",
      })
      .select("id");
    expect(data ?? []).toEqual([]);
    expect(error).toBeTruthy();
  });

  it("rejects board updates from technicians", async () => {
    const { data, error } = await technician
      .from("boards")
      .update({ name: "Hacked name" })
      .eq("id", BOARD_A)
      .select("id");
    expect(data ?? []).toEqual([]);
    expect(
      error === null || error.code === "42501" || error.message.toLowerCase().includes("row-level security"),
    ).toBe(true);

    const { data: board } = await ownerA.from("boards").select("name").eq("id", BOARD_A).single();
    expect(board?.name).not.toBe("Hacked name");
  });

  it("lets sales update faces but not delete/archive them", async () => {
    const { data: face } = await sales
      .from("board_faces")
      .select("id, direction")
      .eq("board_id", BOARD_A)
      .is("archived_at", null)
      .limit(1)
      .single();
    expect(face?.id).toBeTruthy();

    const { error: updateError } = await sales
      .from("board_faces")
      .update({ direction: face!.direction || "North" })
      .eq("id", face!.id)
      .eq("tenant_id", TENANT_A);
    expect(updateError).toBeNull();

    const { data: deleted } = await sales.from("board_faces").delete().eq("id", face!.id).select("id");
    expect(deleted ?? []).toEqual([]);

    const { data: stillThere } = await ownerA.from("board_faces").select("id").eq("id", face!.id).maybeSingle();
    expect(stillThere?.id).toBe(face!.id);
  });

  it("reports board create/update permissions correctly via has_permission", async () => {
    const { data: ownerCreate } = await ownerA.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "boards.create",
    });
    const { data: salesCreate } = await sales.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "boards.create",
    });
    const { data: salesFaces } = await sales.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "faces.update",
    });
    const { data: techBoards } = await technician.rpc("has_permission", {
      _tenant: TENANT_A,
      _permission: "boards.view",
    });
    expect(ownerCreate).toBe(true);
    expect(salesCreate).toBe(false);
    expect(salesFaces).toBe(true);
    expect(techBoards).toBe(false);
  });
});

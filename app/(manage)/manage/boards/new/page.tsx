import { PageHeader } from "@/components/page-header";
import { BoardWizard } from "@/components/boards/board-wizard";
import { requirePermission } from "@/lib/auth/session";

export default async function NewBoardPage() {
  await requirePermission("boards.create");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add board"
        description="Create the structure first, then add faces."
      />
      <BoardWizard />
    </div>
  );
}

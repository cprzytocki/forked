import React, { useState } from "react";
import { useRepoStore } from "@/stores/repoStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/Dialog";

export function CreateBranchDialog() {
  const { createBranch } = useRepoStore();
  const { isCreateBranchDialogOpen, closeCreateBranchDialog } = useUiStore();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (name) {
      await createBranch(name);
      closeCreateBranchDialog();
      setName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  return (
    <Dialog open={isCreateBranchDialogOpen} onOpenChange={closeCreateBranchDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Branch</DialogTitle>
          <DialogDescription>
            Create a new branch from the current HEAD
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Branch Name</label>
            <Input
              placeholder="feature/my-branch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeCreateBranchDialog}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

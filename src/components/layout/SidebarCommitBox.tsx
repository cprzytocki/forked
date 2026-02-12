import { Check } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { useRepoStore } from '@/stores/repoStore';

export function SidebarCommitBox() {
  const [message, setMessage] = useState('');
  const { createCommit, status } = useRepoStore();
  const hasStaged = (status?.staged.length || 0) > 0;

  const handleCommit = () => {
    if (message.trim()) {
      createCommit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCommit();
    }
  };

  return (
    <div className="border-t border-border/40 p-2">
      <textarea
        className="h-20 w-full resize-none rounded-lg border border-border/60 bg-background/80 p-2 text-sm shadow-inset transition-all duration-150 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
        placeholder="Commit message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        className="w-full mt-2"
        disabled={!hasStaged || !message.trim()}
        onClick={handleCommit}
      >
        <Check className="h-4 w-4 mr-2" />
        Commit
      </Button>
    </div>
  );
}

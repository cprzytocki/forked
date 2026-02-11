import { Check } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';

interface CommitBoxProps {
  onCommit: (message: string) => void;
  disabled: boolean;
}

export function SidebarCommitBox({ onCommit, disabled }: CommitBoxProps) {
  const [message, setMessage] = useState('');

  const handleCommit = () => {
    if (message.trim()) {
      onCommit(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCommit();
    }
  };

  return (
    <div className="p-2 border-t">
      <textarea
        className="w-full h-20 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Commit message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        className="w-full mt-2"
        disabled={disabled || !message.trim()}
        onClick={handleCommit}
      >
        <Check className="h-4 w-4 mr-2" />
        Commit
      </Button>
    </div>
  );
}

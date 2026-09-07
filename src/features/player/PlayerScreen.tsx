import { useNavigate } from 'react-router-dom';
import { EmptyState, IconButton, CloseIcon } from '@/components';

/**
 * Full-screen player modal (tab bar hidden), PRD section 6. Placeholder for M0;
 * the workout state machine and screens arrive in M2/M3.
 */
export function PlayerScreen() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-app pt-safe">
      <div className="flex justify-end px-gutter pt-3">
        <IconButton label="Close" onClick={() => navigate('/')}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Player" body="The full-screen workout player will run here." />
      </div>
    </div>
  );
}

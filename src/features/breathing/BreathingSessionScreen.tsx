import { useNavigate } from 'react-router-dom';
import { EmptyState, IconButton, CloseIcon } from '@/components';

/**
 * Full-screen breathing session modal (tab bar hidden), on the deepest bg layer.
 * Placeholder for M0; the breathing state machine arrives in M4.
 */
export function BreathingSessionScreen() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-deep pt-safe">
      <div className="flex justify-end px-gutter pt-3">
        <IconButton label="Close" onClick={() => navigate('/breathe')}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState title="Breathing session" body="The guided breathing session will run here." />
      </div>
    </div>
  );
}

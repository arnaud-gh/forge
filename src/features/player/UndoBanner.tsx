import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from './playerStore';

/**
 * "Set logged · UNDO" (WRK-24) rendered in-flow at the bottom of the content
 * area, above the action zone, so it never overlaps a button. Auto-dismisses 3s.
 */
export function UndoBanner() {
  const { t } = useTranslation('player');
  const open = usePlayerStore((s) => s.undoOpen);
  const dismiss = usePlayerStore((s) => s.dismissUndo);
  const undo = usePlayerStore((s) => s.undoLastSet);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(dismiss, 3000);
    return () => window.clearTimeout(id);
  }, [open, dismiss]);

  if (!open) return null;
  return (
    <div
      role="status"
      className="mt-auto flex w-full items-center overflow-hidden rounded-sm border border-line bg-surface"
    >
      <span className="w-[3px] self-stretch bg-success" aria-hidden />
      <span className="flex-1 px-4 py-3 font-ui text-meta text-ink-secondary">
        {t('setLogged')}
      </span>
      <button
        type="button"
        onClick={undo}
        className="px-4 py-3 font-display text-btn-sm uppercase text-ink-muted"
      >
        {t('undo')}
      </button>
    </div>
  );
}

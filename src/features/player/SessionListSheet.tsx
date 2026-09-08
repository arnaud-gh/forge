import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@/components';
import { cn } from '@/lib/cn';
import { exerciseName, useProgramStore, type Block } from '@/features/program';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { ExercisePicker, type AddExerciseConfig } from '@/features/library/ExercisePicker';
import { usePlayerStore } from './playerStore';
import { SwipeRow, type SwipeAction } from './SwipeRow';
import type { LoggedSet, SetStep } from './types';

type Props = { open: boolean; onClose: () => void };

interface BlockRow {
  blockId: string;
  first: SetStep;
  steps: { step: SetStep; index: number }[];
}
interface SectionGroup {
  sectionId: string;
  name: string;
  type: SetStep['sectionType'];
  blocks: BlockRow[];
}

function cellText(log: LoggedSet | undefined): string {
  if (!log) return '';
  if (log.status === 'skipped') return '–';
  if (log.weightKg !== undefined && log.reps !== undefined) return `${log.weightKg}×${log.reps}`;
  if (log.chunks !== undefined) return `${log.chunks}c`;
  if (log.reps !== undefined) return `${log.reps}`;
  if (log.seconds !== undefined) return `${log.seconds}s`;
  return '✓';
}

function groupSteps(steps: SetStep[]): SectionGroup[] {
  const sections: SectionGroup[] = [];
  steps.forEach((step, index) => {
    let section = sections.find((s) => s.sectionId === step.sectionId);
    if (!section) {
      section = {
        sectionId: step.sectionId,
        name: step.sectionName,
        type: step.sectionType,
        blocks: [],
      };
      sections.push(section);
    }
    let block = section.blocks.find((b) => b.blockId === step.blockId);
    if (!block) {
      block = { blockId: step.blockId, first: step, steps: [] };
      section.blocks.push(block);
    }
    block.steps.push({ step, index });
  });
  return sections;
}

/** Build a program Block from the add-exercise picker config (WRK-16). */
function blockFromConfig(c: AddExerciseConfig): Block {
  const set =
    c.targetType === 'duration'
      ? { type: 'duration' as const, seconds: c.repsMax }
      : c.targetType === 'reps'
        ? { type: 'reps' as const, reps: c.repsMax }
        : { type: 'repRange' as const, min: Math.max(1, c.repsMax - 4), max: c.repsMax };
  return {
    id: `added-${Date.now().toString(36)}`,
    exerciseId: c.exercise.id,
    sets: Array.from({ length: c.sets }, () => ({ ...set })),
    restSeconds: c.restSeconds,
  };
}

// Session list (WRK-14): per-set status, go to set, skip section, and per-row
// swipe actions (notes, swap via the library picker, delete), edit sets, add exercise.
export function SessionListSheet({ open, onClose }: Props) {
  const { t } = useTranslation('player');
  const program = useProgramStore((s) => s.program);
  const steps = usePlayerStore((s) => s.steps);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const logs = usePlayerStore((s) => s.logs);
  const notes = usePlayerStore((s) => s.notes);
  const goToStepIndex = usePlayerStore((s) => s.goToStepIndex);
  const skipSection = usePlayerStore((s) => s.skipSection);
  const swapBlock = usePlayerStore((s) => s.swapBlock);
  const setBlockNote = usePlayerStore((s) => s.setBlockNote);
  const removeBlock = usePlayerStore((s) => s.removeBlock);
  const addBlock = usePlayerStore((s) => s.addBlock);
  const editSetCount = usePlayerStore((s) => s.editSetCount);

  const [noteBlock, setNoteBlock] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [swapStep, setSwapStep] = useState<SetStep | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const sections = groupSteps(steps);
  const name = (id: string) => (program ? exerciseName(program, id) : id);
  const currentSectionId = steps[currentIndex]?.sectionId ?? sections[0]?.sectionId ?? '';

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={t('list.title')}
        closeLabel={t('list.title')}
        footer={
          <Button variant="secondary" size="md" onClick={() => setAddOpen(true)}>
            {t('list.addExercise')}
          </Button>
        }
      >
        <div className="space-y-6 pb-4">
          <p className="font-ui text-meta text-ink-faint">{t('list.swipeHint')}</p>
          {sections.map((section) => (
            <section key={section.sectionId}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
                  {section.name} · {t(`sectionType.${section.type}`)}
                </span>
                <button
                  type="button"
                  onClick={() => skipSection(section.sectionId)}
                  className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
                >
                  {t('list.skipSection')}
                </button>
              </div>

              <ul className="space-y-3">
                {section.blocks.map((block) => {
                  const actions: SwipeAction[] = [
                    {
                      key: 'notes',
                      label: t('list.notes'),
                      onPress: () => {
                        setNoteBlock(block.blockId);
                        setNoteText(notes[block.blockId] ?? '');
                      },
                    },
                    {
                      key: 'swap',
                      label: t('list.swap'),
                      tone: 'accent' as const,
                      onPress: () => setSwapStep(block.first),
                    },
                    {
                      key: 'delete',
                      label: t('list.delete'),
                      tone: 'danger' as const,
                      onPress: () => removeBlock(block.blockId),
                    },
                  ];
                  const canEditSets = section.type !== 'circuit';
                  return (
                    <li key={block.blockId}>
                      <SwipeRow actions={actions}>
                        <div className="px-3 py-3">
                          <p className="font-display text-display-xs uppercase text-ink">
                            {name(block.first.exerciseId)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {block.steps.map(({ step, index }) => {
                              const log = logs[step.key];
                              const isCurrent = index === currentIndex;
                              return (
                                <button
                                  key={step.key}
                                  type="button"
                                  onClick={() => {
                                    goToStepIndex(index);
                                    onClose();
                                  }}
                                  className={cn(
                                    'min-w-9 rounded-xs border px-2 py-1 text-center font-ui text-meta tabular-nums',
                                    isCurrent
                                      ? 'border-accent text-accent'
                                      : log?.status === 'done'
                                        ? 'border-transparent bg-ink/10 text-ink-secondary'
                                        : log?.status === 'skipped'
                                          ? 'border-transparent text-ink-ghost line-through'
                                          : 'border-line-strong text-ink-muted',
                                  )}
                                >
                                  {cellText(log) || step.setIndex + 1}
                                </button>
                              );
                            })}
                            {canEditSets && (
                              <span className="ml-1 inline-flex items-center gap-1 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                                {t('list.sets')}
                                <button
                                  type="button"
                                  aria-label="−"
                                  onClick={() =>
                                    editSetCount(block.blockId, block.first.setCount - 1)
                                  }
                                  className="h-7 w-7 rounded-xs border border-line-strong text-ink-secondary"
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  aria-label="+"
                                  onClick={() =>
                                    editSetCount(block.blockId, block.first.setCount + 1)
                                  }
                                  className="h-7 w-7 rounded-xs border border-line-strong text-ink-secondary"
                                >
                                  +
                                </button>
                              </span>
                            )}
                          </div>
                          {notes[block.blockId] && (
                            <p className="mt-2 font-ui text-meta text-ink-faint">
                              {notes[block.blockId]}
                            </p>
                          )}
                        </div>
                      </SwipeRow>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Sheet>

      {/* Note editor */}
      <Sheet
        open={noteBlock !== null}
        onClose={() => setNoteBlock(null)}
        title={t('list.notes')}
        closeLabel={t('list.notes')}
        footer={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (noteBlock) setBlockNote(noteBlock, noteText.trim());
              setNoteBlock(null);
            }}
          >
            {t('list.saveNote')}
          </Button>
        }
      >
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={t('list.notePlaceholder')}
          rows={4}
          className="w-full rounded-sm border border-line-strong bg-transparent p-3 font-ui text-body text-ink placeholder:text-ink-ghost"
        />
      </Sheet>

      {/* Swap picker: program alternatives first, then library "Similar" (WRK-15) */}
      {swapStep && (
        <ExercisePicker
          mode="swap"
          open
          onClose={() => setSwapStep(null)}
          baseExerciseId={swapStep.exerciseId}
          programAlternatives={swapStep.alternatives}
          onSelect={(ex) => swapBlock(swapStep.blockId, ex.id)}
        />
      )}

      {/* Add exercise over the full library (WRK-16) */}
      <ExercisePicker
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(config) =>
          addBlock(
            currentSectionId,
            blockFromConfig(config),
            useSettingsStore.getState().settings.timers,
          )
        }
      />
    </>
  );
}

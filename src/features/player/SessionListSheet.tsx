import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@/components';
import { cn } from '@/lib/cn';
import { exerciseName, useProgramStore } from '@/features/program';
import { usePlayerStore } from './playerStore';
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

  const [noteBlock, setNoteBlock] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [swapStep, setSwapStep] = useState<SetStep | null>(null);

  const sections = groupSteps(steps);
  const name = (id: string) => (program ? exerciseName(program, id) : id);

  return (
    <>
      <Sheet open={open} onClose={onClose} title={t('list.title')} closeLabel={t('list.title')}>
        <div className="space-y-6 pb-4">
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
                {section.blocks.map((block) => (
                  <li key={block.blockId} className="rounded-sm border border-line px-3 py-3">
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
                    </div>
                    <div className="mt-2 flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setNoteBlock(block.blockId);
                          setNoteText(notes[block.blockId] ?? '');
                        }}
                        className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
                      >
                        {t('list.notes')}
                      </button>
                      {block.first.alternatives.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSwapStep(block.first)}
                          className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted"
                        >
                          {t('list.swap')}
                        </button>
                      )}
                    </div>
                    {notes[block.blockId] && (
                      <p className="mt-2 font-ui text-meta text-ink-faint">
                        {notes[block.blockId]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="font-ui text-meta text-ink-ghost">{t('list.addExercise')}</p>
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

      {/* Swap picker (program alternatives) */}
      <Sheet
        open={swapStep !== null}
        onClose={() => setSwapStep(null)}
        title={t('list.swapTitle')}
        closeLabel={t('list.swapTitle')}
      >
        <ul className="space-y-2 pb-4">
          {swapStep?.alternatives.map((altId) => (
            <li key={altId}>
              <button
                type="button"
                onClick={() => {
                  if (swapStep) swapBlock(swapStep.blockId, altId);
                  setSwapStep(null);
                }}
                className="w-full rounded-sm border border-line px-4 py-3 text-left font-display text-display-xs uppercase text-ink"
              >
                {name(altId)}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Sheet, Stepper } from '@/components';
import { cn } from '@/lib/cn';
import { useProgramStore } from '@/features/program';
import { useSettings } from '@/features/settings/settingsStore';
import {
  allEquipment,
  allMuscles,
  resolveExercise,
  searchExercises,
  similarExercises,
  type Exercise,
} from './exercises';
import { ExerciseImage } from './ExerciseImage';

export interface AddExerciseConfig {
  exercise: Exercise;
  sets: number;
  targetType: 'repRange' | 'reps' | 'duration';
  repsMax: number;
  restSeconds: number;
}

type SwapProps = {
  mode: 'swap';
  open: boolean;
  onClose: () => void;
  /** The block's current exercise (for "Similar"). */
  baseExerciseId: string;
  /** The block's program-defined alternatives (first group). */
  programAlternatives: string[];
  onSelect: (exercise: Exercise) => void;
};

type AddProps = {
  mode: 'add';
  open: boolean;
  onClose: () => void;
  onAdd: (config: AddExerciseConfig) => void;
};

type Props = SwapProps | AddProps;

function Row({
  exercise,
  selected,
  onClick,
}: {
  exercise: Exercise;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left',
        selected ? 'border-accent' : 'border-line',
      )}
    >
      <ExerciseImage exercise={exercise} className="h-12 w-12 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate font-display text-display-xs uppercase text-ink">
          {exercise.name}
        </span>
        <span className="block truncate font-ui text-meta text-ink-muted">
          {exercise.primaryMuscles.join(', ')} · {exercise.equipment}
        </span>
      </span>
    </button>
  );
}

// Swap picker (WRK-15) and add-exercise picker (WRK-16) over the library.
export function ExercisePicker(props: Props) {
  const { t } = useTranslation(['library', 'common']);
  const program = useProgramStore((s) => s.program);
  const equipment = useSettings().equipment;

  const [queryText, setQueryText] = useState('');
  const [muscle, setMuscle] = useState<string>('');
  const [equip, setEquip] = useState<string>('');
  const [selected, setSelected] = useState<Exercise | null>(null);
  // Add mode, step 2.
  const [sets, setSets] = useState(3);
  const [repsMax, setRepsMax] = useState(12);
  const [rest, setRest] = useState(90);
  const [targetType, setTargetType] = useState<AddExerciseConfig['targetType']>('repRange');

  const base = props.mode === 'swap' ? resolveExercise(program, props.baseExerciseId) : null;
  const programAlts: Exercise[] = useMemo(
    () =>
      props.mode === 'swap'
        ? props.programAlternatives
            .map((id) => resolveExercise(program, id))
            .filter((e): e is Exercise => e !== null)
        : [],
    [props, program],
  );
  const similar: Exercise[] = useMemo(() => {
    if (props.mode !== 'swap' || !base) return [];
    const exclude = new Set(props.programAlternatives);
    return similarExercises(base, equipment, exclude);
  }, [props, base, equipment]);

  const results: Exercise[] = useMemo(() => {
    if (props.mode === 'add' || queryText.trim()) {
      return searchExercises(queryText, {
        ...(muscle ? { muscle } : {}),
        ...(equip ? { equipment: equip } : {}),
      });
    }
    return [];
  }, [props.mode, queryText, muscle, equip]);

  const close = () => {
    setSelected(null);
    setQueryText('');
    props.onClose();
  };

  const footer =
    props.mode === 'swap' ? (
      <Button
        variant="primary"
        size="md"
        disabled={!selected}
        onClick={() => {
          if (selected) props.onSelect(selected);
          close();
        }}
      >
        {t('picker.confirm')}
      </Button>
    ) : selected ? (
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          props.onAdd({ exercise: selected, sets, targetType, repsMax, restSeconds: rest });
          close();
        }}
      >
        {t('picker.add')}
      </Button>
    ) : undefined;

  return (
    <Sheet
      open={props.open}
      onClose={close}
      title={props.mode === 'swap' ? t('picker.similar') : t('picker.all')}
      closeLabel={t('common:actions.close')}
      footer={footer}
    >
      <div className="space-y-4 pb-4">
        {/* Add mode, step 2: configure the block. */}
        {props.mode === 'add' && selected ? (
          <div className="space-y-4">
            <Row exercise={selected} selected onClick={() => setSelected(null)} />
            <div className="flex gap-2">
              {(['repRange', 'reps', 'duration'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTargetType(k)}
                  className={cn(
                    'flex-1 rounded-sm border py-2 font-display text-btn-sm uppercase',
                    targetType === k
                      ? 'border-accent text-accent'
                      : 'border-line-emphasis text-ink-muted',
                  )}
                >
                  {t(`picker.${k === 'reps' ? 'repsFixed' : k}`)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Stepper
                label={t('picker.sets')}
                value={sets}
                onChange={setSets}
                min={1}
                max={10}
                className="flex-1"
              />
              <Stepper
                label={targetType === 'duration' ? t('picker.duration') : t('picker.reps')}
                value={repsMax}
                onChange={setRepsMax}
                min={1}
                step={targetType === 'duration' ? 5 : 1}
                className="flex-1"
              />
              <Stepper
                label={t('picker.rest')}
                value={rest}
                onChange={setRest}
                min={0}
                step={15}
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <>
            <input
              type="search"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={t('picker.search')}
              className="w-full rounded-sm border border-line-strong bg-transparent px-3 py-3 font-ui text-body text-ink placeholder:text-ink-ghost"
            />

            {props.mode === 'add' && (
              <div className="flex gap-2">
                <select
                  value={muscle}
                  onChange={(e) => setMuscle(e.target.value)}
                  className="flex-1 rounded-sm border border-line-strong bg-app px-2 py-2 font-ui text-meta text-ink"
                >
                  <option value="">
                    {t('picker.muscle')}: {t('picker.any')}
                  </option>
                  {allMuscles().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={equip}
                  onChange={(e) => setEquip(e.target.value)}
                  className="flex-1 rounded-sm border border-line-strong bg-app px-2 py-2 font-ui text-meta text-ink"
                >
                  <option value="">
                    {t('picker.equipment')}: {t('picker.any')}
                  </option>
                  {allEquipment().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {props.mode === 'swap' && !queryText.trim() && (
              <>
                {programAlts.length > 0 && (
                  <section>
                    <h3 className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                      {t('picker.fromProgram')}
                    </h3>
                    <div className="space-y-2">
                      {programAlts.map((e) => (
                        <Row
                          key={e.id}
                          exercise={e}
                          selected={selected?.id === e.id}
                          onClick={() => setSelected(e)}
                        />
                      ))}
                    </div>
                  </section>
                )}
                <section>
                  <h3 className="mb-2 font-ui text-label-xs uppercase tracking-[0.14em] text-ink-muted">
                    {t('picker.similar')}
                  </h3>
                  <div className="space-y-2">
                    {similar.map((e) => (
                      <Row
                        key={e.id}
                        exercise={e}
                        selected={selected?.id === e.id}
                        onClick={() => setSelected(e)}
                      />
                    ))}
                    {similar.length === 0 && (
                      <p className="font-ui text-meta text-ink-faint">{t('picker.noResults')}</p>
                    )}
                  </div>
                </section>
              </>
            )}

            {(props.mode === 'add' || queryText.trim()) && (
              <div className="space-y-2">
                {results.map((e) => (
                  <Row
                    key={e.id}
                    exercise={e}
                    selected={selected?.id === e.id}
                    onClick={() => setSelected(e)}
                  />
                ))}
                {results.length === 0 && (
                  <p className="font-ui text-meta text-ink-faint">{t('picker.noResults')}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}

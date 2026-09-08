import { useTranslation } from 'react-i18next';
import { Chip } from '@/components';
import type { ProgramSet } from '@/features/program';
import type { RecommendationKind } from '@/features/progression';

type Props = {
  kind: RecommendationKind | undefined;
  target: ProgramSet;
  assisted: boolean;
};

// Recommendation chip wording (PROG-2/3/4, assisted-inverted PROG-8).
export function RecommendationChip({ kind, target, assisted }: Props) {
  const { t } = useTranslation('player');
  if (!kind || kind === 'none') return null;

  const max = target.type === 'repRange' ? target.max : target.type === 'reps' ? target.reps : 0;
  const min = target.type === 'repRange' ? target.min : max;

  let text: string;
  if (kind === 'increase') {
    text = assisted ? t('prog.increaseAssist') : t('prog.increase');
  } else if (kind === 'hold') {
    text = assisted ? t('prog.holdAssist', { max }) : t('prog.hold', { max });
  } else {
    text = assisted ? t('prog.belowAssist', { min, max }) : t('prog.below', { min, max });
  }
  return <Chip>{text}</Chip>;
}

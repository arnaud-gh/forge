import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BreatheIcon,
  Button,
  Card,
  Chip,
  Dialog,
  EffortSelector,
  EmptyState,
  GigaTimer,
  HistoryIcon,
  HomeIcon,
  IconButton,
  ListIcon,
  PauseIcon,
  SegmentedProgressBar,
  SettingsIcon,
  Sheet,
  Stepper,
  TabBar,
  Toast,
  WeekDayCell,
  type Effort,
  type ProgressSegment,
} from '@/components';

/**
 * Hidden gallery of every design-system primitive in every state (M0 step 3).
 * Reachable only at /dev/components. Dev-only, so literal strings are fine here.
 */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-6">
      <h2 className="mb-4 font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const weekStates = [
  { letter: 'M', date: 3, state: 'done' as const, label: 'PUSH', today: false },
  { letter: 'T', date: 4, state: 'rest' as const, label: 'REST', today: false },
  { letter: 'W', date: 5, state: 'todo' as const, label: 'PULL', today: true },
  { letter: 'T', date: 6, state: 'rest' as const, label: 'REST', today: false },
  { letter: 'F', date: 7, state: 'todo' as const, label: 'LEGS', today: false },
  { letter: 'S', date: 8, state: 'missed' as const, label: 'CORE', today: false },
  { letter: 'S', date: 9, state: 'rest' as const, label: 'REST', today: false },
];

const progressSegments: ProgressSegment[] = [
  { weight: 1, status: 'done' },
  { weight: 3, status: 'done' },
  { weight: 3, status: 'current', progress: 0.5 },
  { weight: 3, status: 'upcoming' },
  { weight: 2, status: 'upcoming' },
];

const tabItems = [
  { key: 'home', label: 'Home', icon: <HomeIcon /> },
  { key: 'breathe', label: 'Breathe', icon: <BreatheIcon /> },
  { key: 'history', label: 'History', icon: <HistoryIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

export function ComponentsPage() {
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(9);
  const [effort, setEffort] = useState<Effort | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen-safe bg-app pb-24 pt-safe">
      <div className="px-gutter">
        <header className="py-6">
          <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
            /dev/components
          </p>
          <h1 className="font-display text-display-md uppercase text-ink">Design system</h1>
        </header>

        <Section title="Buttons">
          <Row>
            <div className="w-full max-w-[240px] space-y-3">
              <Button variant="primary">Start session</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Discard</Button>
              <Button variant="ghost">Finish</Button>
            </div>
          </Row>
          <Row>
            <div className="flex w-full max-w-[240px] gap-2">
              <Button variant="secondary" size="md">
                +15 s
              </Button>
              <Button variant="primary" size="md">
                Skip rest
              </Button>
            </div>
          </Row>
          <Row>
            <IconButton label="Close">
              <ListIcon />
            </IconButton>
            <IconButton label="Pause">
              <PauseIcon />
            </IconButton>
            <div className="rounded-sm bg-surface p-3">
              <IconButton label="List" onPhoto>
                <ListIcon />
              </IconButton>
            </div>
          </Row>
        </Section>

        <Section title="Steppers">
          <div className="flex gap-3">
            <Stepper
              label="Weight"
              value={weight}
              onChange={setWeight}
              step={2.5}
              min={0}
              unit="kg"
              allowDecimalEntry
              changed={weight !== 60}
              className="flex-1"
            />
            <Stepper
              label="Reps"
              value={reps}
              onChange={setReps}
              step={1}
              min={0}
              className="flex-1"
            />
          </div>
          <p className="font-ui text-meta text-ink-faint">
            Long-press +/- to repeat. Tap the value for the keypad. Changed value shows amber.
          </p>
        </Section>

        <Section title="Effort selector">
          <EffortSelector value={effort} onSelect={setEffort} />
          <p className="font-ui text-meta text-ink-faint">Selected: {effort ?? 'none'}</p>
        </Section>

        <Section title="Chips">
          <Row>
            <Chip>Increase weight</Chip>
            <Chip variant="info">Last: 30 kg x 9</Chip>
          </Row>
        </Section>

        <Section title="Cards">
          <Card padding="today">
            <div className="flex items-baseline justify-between">
              <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
                Today
              </span>
              <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-ink-muted">
                45 min · 6 exercises
              </span>
            </div>
            <h3 className="mt-2 font-display text-display-lg uppercase text-ink">Push A</h3>
            <p className="mb-4 font-ui text-meta text-ink-muted">Main, superset, finisher</p>
            <Button variant="primary">Start</Button>
          </Card>
          <Card padding="summary">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xs border border-line-strong bg-surface" />
              <div>
                <p className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
                  Completed
                </p>
                <p className="font-display text-display-xs uppercase text-ink">Pull A</p>
                <p className="font-ui text-meta text-ink-muted">38 min · 18 sets · 4200 kg</p>
              </div>
            </div>
          </Card>
          <Card padding="today" accent>
            <span className="font-ui text-label-sm uppercase tracking-[0.14em] text-accent">
              In progress · 12:04
            </span>
            <h3 className="mt-2 font-display text-display-lg uppercase text-ink">Legs A</h3>
            <p className="mb-4 font-ui text-meta text-ink-muted">12 of 24 sets done</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="md" block={false}>
                Discard
              </Button>
              <Button variant="primary" size="md">
                Resume
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="Week strip">
          <div className="flex overflow-hidden rounded-sm border border-line divide-x divide-line-faint">
            {weekStates.map((d, i) => (
              <WeekDayCell
                key={i}
                dayLetter={d.letter}
                date={d.date}
                state={d.state}
                sessionLabel={d.label}
                isToday={d.today}
              />
            ))}
          </div>
        </Section>

        <Section title="Segmented progress bar">
          <SegmentedProgressBar segments={progressSegments} />
        </Section>

        <Section title="Giga timer">
          <div className="flex flex-col items-center gap-8 py-4">
            <GigaTimer seconds={90} variant="rest" progress={0.4} caption="Rest · of 2:00" />
            <GigaTimer seconds={75} variant="set" progress={0.6} caption="Set time" />
            <GigaTimer seconds={128} variant="breath" caption="Retention" />
            <div className="flex flex-col items-center gap-1">
              <GigaTimer seconds={3} variant="rest" progress={0.95} caption="Last 5s pulse" pulse />
            </div>
            <div className="flex flex-col items-center gap-1">
              <GigaTimer seconds={3735} variant="rest" caption="Clamp: 1:02:15 steps down" />
            </div>
          </div>
        </Section>

        <Section title="Sheet / Dialog / Toast">
          <Row>
            <Button variant="secondary" size="md" block={false} onClick={() => setSheetOpen(true)}>
              Open sheet
            </Button>
            <Button variant="secondary" size="md" block={false} onClick={() => setDialogOpen(true)}>
              Confirm dialog
            </Button>
            <Button
              variant="secondary"
              size="md"
              block={false}
              onClick={() => setDestructiveOpen(true)}
            >
              Destructive dialog
            </Button>
            <Button variant="secondary" size="md" block={false} onClick={() => setToastOpen(true)}>
              Show toast
            </Button>
          </Row>
        </Section>

        <Section title="Empty state">
          <EmptyState
            title="No workouts yet"
            body="Completed sessions will show up here."
            action={
              <Button variant="secondary" size="md" block={false}>
                Import a program
              </Button>
            }
          />
        </Section>

        <Section title="Tab bar">
          <div className="overflow-hidden rounded-sm border border-line">
            <TabBar items={tabItems} activeKey={activeTab} onSelect={setActiveTab} />
          </div>
        </Section>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Session list"
        footer={
          <Button variant="secondary" size="md">
            Add exercise
          </Button>
        }
      >
        <p className="py-4 font-ui text-body text-ink-secondary">
          Sheet content scrolls here. Used for the session list, pickers and keypad.
        </p>
      </Sheet>

      <Dialog
        open={dialogOpen}
        title="Finish session?"
        body="You have 6 sets not done."
        cancelLabel="Cancel"
        confirmLabel="Finish"
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => setDialogOpen(false)}
      />
      <Dialog
        open={destructiveOpen}
        title="Discard workout?"
        body="This deletes the in-progress workout."
        cancelLabel="Cancel"
        confirmLabel="Discard"
        confirmVariant="destructive"
        onCancel={() => setDestructiveOpen(false)}
        onConfirm={() => setDestructiveOpen(false)}
      />
      <Toast
        open={toastOpen}
        message="Set logged"
        actionLabel="Undo"
        onAction={() => setToastOpen(false)}
        onDismiss={() => setToastOpen(false)}
      />
    </div>
  );
}

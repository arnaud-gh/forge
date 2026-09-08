import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Dialog, Stepper, Toggle } from '@/components';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/features/auth';
import {
  ImportError,
  activationStartDate,
  importProgram,
  parseISODate,
  useProgramStore,
} from '@/features/program';
import { allEquipment, isLibraryLoaded, localImageUrls } from '@/features/library/exercises';
import { useSettingsStore } from './settingsStore';
import type { BreathingSpeed } from './types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 font-ui text-label uppercase tracking-[0.14em] text-ink-muted">
        {title}
      </h2>
      <Card padding="summary">{children}</Card>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-ui text-body text-ink">{label}</span>
      <span className="font-ui text-body text-ink-muted">{value}</span>
    </div>
  );
}

// Settings (SET-1..6, offline download, About). Sections per DESIGN.md.
export function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const program = useProgramStore((s) => s.program);
  const progress = useProgramStore((s) => s.progress);
  const activateProgram = useProgramStore((s) => s.activateProgram);
  const resetProgress = useProgramStore((s) => s.resetProgress);
  const setStartDate = useProgramStore((s) => s.setStartDate);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [download, setDownload] = useState<{ done: number; total: number } | null>(null);

  const onImportFile = async (file: File) => {
    setImportError(null);
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const parsed = importProgram(raw);
      await activateProgram(parsed);
    } catch (err) {
      setImportError(err instanceof ImportError ? err.issues.join(' · ') : String(err));
    }
  };

  const onDownloadOffline = async () => {
    const urls = localImageUrls();
    setDownload({ done: 0, total: urls.length });
    let done = 0;
    for (const url of urls) {
      try {
        await fetch(url, { cache: 'force-cache' });
      } catch {
        // ignore individual failures
      }
      done += 1;
      setDownload({ done, total: urls.length });
    }
  };

  const toggleEquipment = (eq: string) => {
    const has = settings.equipment.includes(eq);
    void update({
      equipment: has ? settings.equipment.filter((e) => e !== eq) : [...settings.equipment, eq],
    });
  };

  return (
    <div className="min-h-full px-gutter py-8">
      <h1 className="mb-6 font-display text-display-md uppercase text-ink">{t('title')}</h1>

      <Section title={t('account')}>
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="h-10 w-10 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-display-xs uppercase text-ink">
              {user?.displayName || t('signedIn')}
            </p>
            {user?.email && (
              <p className="truncate font-ui text-meta text-ink-muted">{user.email}</p>
            )}
          </div>
          <Button variant="ghost" size="md" block={false} onClick={() => void signOut()}>
            {t('common:actions.signOut')}
          </Button>
        </div>
      </Section>

      <Section title={t('program.title')}>
        <Row label={t('program.title')} value={program?.name ?? t('program.none')} />
        {progress && (
          <div className="flex items-center justify-between py-2">
            <span className="font-ui text-body text-ink">{t('program.startDate')}</span>
            <input
              type="date"
              value={progress.startDate}
              onChange={(e) => {
                if (!e.target.value) return;
                void setStartDate(activationStartDate(parseISODate(e.target.value)));
              }}
              className="rounded-xs border border-line-strong bg-transparent px-2 py-1 font-ui text-meta text-ink"
            />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="md" onClick={() => fileRef.current?.click()}>
            {t('program.import')}
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={() => setConfirmReset(true)}
            disabled={!program}
          >
            {t('program.reset')}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.target.value = '';
          }}
        />
        {importError && (
          <p className="mt-2 font-ui text-meta text-danger">
            {t('program.importError')}: {importError}
          </p>
        )}
      </Section>

      <Section title={t('timers.title')}>
        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label={t('timers.secondsPerRep')}
            value={settings.timers.secondsPerRep}
            onChange={(v) => void update({ timers: { secondsPerRep: v } })}
            min={1}
            max={10}
          />
          <Stepper
            label={t('timers.margin')}
            value={settings.timers.setMarginSeconds}
            onChange={(v) => void update({ timers: { setMarginSeconds: v } })}
            min={0}
            step={5}
          />
          <Stepper
            label={t('timers.rest')}
            value={settings.timers.defaultRestSeconds}
            onChange={(v) => void update({ timers: { defaultRestSeconds: v } })}
            min={0}
            step={15}
          />
          <Stepper
            label={t('timers.prep')}
            value={settings.timers.defaultPrepSeconds}
            onChange={(v) => void update({ timers: { defaultPrepSeconds: v } })}
            min={0}
            step={5}
          />
        </div>
      </Section>

      <Section title={t('sounds.title')}>
        <div className="divide-y divide-line-faint">
          <Toggle
            label={t('sounds.sounds')}
            value={settings.timers.sounds}
            onChange={(v) => void update({ timers: { sounds: v } })}
          />
          <Toggle
            label={t('sounds.vibration')}
            value={settings.timers.vibration}
            onChange={(v) => void update({ timers: { vibration: v } })}
          />
          <Toggle
            label={t('sounds.beeps')}
            value={settings.timers.restCountdownBeeps}
            onChange={(v) => void update({ timers: { restCountdownBeeps: v } })}
          />
        </div>
      </Section>

      <Section title={t('equipment.title')}>
        <p className="mb-3 font-ui text-meta text-ink-muted">{t('equipment.hint')}</p>
        <div className="flex flex-wrap gap-2">
          {(isLibraryLoaded() ? allEquipment() : []).map((eq) => {
            const on = settings.equipment.includes(eq);
            return (
              <button
                key={eq}
                type="button"
                onClick={() => toggleEquipment(eq)}
                className={cn(
                  'rounded-xs border px-2.5 py-[5px] font-ui text-[10px] font-bold uppercase tracking-[0.04em]',
                  on
                    ? 'border-[var(--accent-border)] text-accent'
                    : 'border-line-emphasis text-ink-secondary',
                )}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t('breathing.title')}>
        <div className="space-y-3">
          {(['slow', 'standard', 'fast'] as BreathingSpeed[]).map((speed) => (
            <div key={speed} className="grid grid-cols-2 gap-3">
              <Stepper
                label={`${t(`breathing.${speed}`)} · ${t('breathing.inhale')}`}
                value={settings.breathing.presets[speed].inhaleSec}
                onChange={(v) =>
                  void update({ breathing: { presets: { [speed]: { inhaleSec: v } } } })
                }
                min={1}
                max={10}
              />
              <Stepper
                label={`${t(`breathing.${speed}`)} · ${t('breathing.exhale')}`}
                value={settings.breathing.presets[speed].exhaleSec}
                onChange={(v) =>
                  void update({ breathing: { presets: { [speed]: { exhaleSec: v } } } })
                }
                min={1}
                max={10}
              />
            </div>
          ))}
          <Stepper
            label={t('breathing.recovery')}
            value={settings.breathing.recoveryHoldSeconds}
            onChange={(v) => void update({ breathing: { recoveryHoldSeconds: v } })}
            min={5}
            max={60}
            step={5}
          />
        </div>
      </Section>

      <Section title={t('units.title')}>
        <Row label={t('units.units')} value={t('units.kg')} />
        <Row label={t('units.language')} value={t('units.english')} />
      </Section>

      <Section title={t('offline.title')}>
        <Button
          variant="secondary"
          size="md"
          onClick={() => void onDownloadOffline()}
          disabled={!!download && download.done < download.total}
        >
          {download
            ? download.done < download.total
              ? t('offline.downloading', { done: download.done, total: download.total })
              : t('offline.done')
            : t('offline.download')}
        </Button>
      </Section>

      <Section title={t('about.title')}>
        <p className="font-ui text-meta text-ink-muted">{t('about.fonts')}</p>
        <p className="mt-1 font-ui text-meta text-ink-muted">{t('about.exercises')}</p>
      </Section>

      <Dialog
        open={confirmReset}
        title={t('program.resetTitle')}
        body={t('program.resetBody')}
        cancelLabel={t('common:actions.cancel')}
        confirmLabel={t('program.resetConfirm')}
        confirmVariant="destructive"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void resetProgress();
        }}
      />
    </div>
  );
}

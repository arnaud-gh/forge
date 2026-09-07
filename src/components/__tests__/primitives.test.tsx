import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Button,
  IconButton,
  Stepper,
  EffortSelector,
  Chip,
  Card,
  WeekDayCell,
  SegmentedProgressBar,
  GigaTimer,
  Sheet,
  Dialog,
  Toast,
  TabBar,
  EmptyState,
  HomeIcon,
  CloseIcon,
} from '@/components';
import type { DayState, ProgressSegment } from '@/components';

describe('Button', () => {
  it('renders each variant and disables', () => {
    const { rerender } = render(<Button variant="primary">Start</Button>);
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    for (const variant of ['secondary', 'ghost', 'destructive'] as const) {
      rerender(<Button variant={variant}>Label</Button>);
      expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument();
    }
    rerender(
      <Button variant="primary" disabled>
        Off
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });
});

describe('IconButton', () => {
  it('renders with an accessible label', () => {
    render(
      <IconButton label="Close">
        <CloseIcon />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});

describe('Stepper', () => {
  it('shows the value and increments on the plus control', () => {
    const onChange = vi.fn();
    render(<Stepper label="Reps" value={9} onChange={onChange} step={1} />);
    expect(screen.getByText('9')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Increase Reps' }));
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Increase Reps' }));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('respects min on decrement', () => {
    const onChange = vi.fn();
    render(<Stepper label="Reps" value={0} onChange={onChange} step={1} min={0} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Decrease Reps' }));
    fireEvent.pointerUp(screen.getByRole('button', { name: 'Decrease Reps' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('EffortSelector', () => {
  it('renders three options and reports selection', () => {
    const onSelect = vi.fn();
    render(<EffortSelector value="ideal" onSelect={onSelect} />);
    expect(screen.getByRole('radio', { name: 'EASY' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'IDEAL' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'MAX' }));
    expect(onSelect).toHaveBeenCalledWith('max');
  });
});

describe('Chip', () => {
  it('renders recommendation and info variants', () => {
    const { rerender } = render(<Chip>Increase weight</Chip>);
    expect(screen.getByText('Increase weight')).toBeInTheDocument();
    rerender(<Chip variant="info">Last: 30 kg</Chip>);
    expect(screen.getByText('Last: 30 kg')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('renders children in each padding and accent variant', () => {
    const { rerender } = render(<Card padding="today">Today</Card>);
    expect(screen.getByText('Today')).toBeInTheDocument();
    rerender(
      <Card padding="summary" accent>
        Summary
      </Card>,
    );
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });
});

describe('WeekDayCell', () => {
  it('renders every state', () => {
    for (const state of ['done', 'todo', 'missed', 'rest'] as DayState[]) {
      const { unmount } = render(
        <WeekDayCell dayLetter="M" date={3} state={state} sessionLabel="PUSH" />,
      );
      expect(screen.getByText('3')).toBeInTheDocument();
      unmount();
    }
    render(<WeekDayCell dayLetter="W" date={5} state="todo" isToday />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

describe('SegmentedProgressBar', () => {
  it('renders one element per segment', () => {
    const segments: ProgressSegment[] = [
      { weight: 1, status: 'done' },
      { weight: 2, status: 'current', progress: 0.5 },
      { weight: 1, status: 'upcoming' },
    ];
    const { container } = render(<SegmentedProgressBar segments={segments} />);
    // Outer flex wrapper + 3 segment divs.
    expect(container.firstElementChild?.children).toHaveLength(3);
  });
});

describe('GigaTimer', () => {
  it('renders the formatted value and caption', () => {
    render(<GigaTimer seconds={90} variant="rest" progress={0.5} caption="Rest" />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
  });
});

describe('Sheet', () => {
  it('renders content when open and nothing when closed', () => {
    const { rerender } = render(
      <Sheet open={false} onClose={() => {}} title="List">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
    rerender(
      <Sheet open onClose={() => {}} title="List">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('renders and confirms', () => {
    const onConfirm = vi.fn();
    render(
      <Dialog
        open
        title="Finish?"
        body="6 sets left"
        cancelLabel="Cancel"
        confirmLabel="Finish"
        onCancel={() => {}}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('Finish?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('Toast', () => {
  it('renders the message and fires the action', () => {
    const onAction = vi.fn();
    render(
      <Toast
        open
        message="Set logged"
        actionLabel="Undo"
        onAction={onAction}
        onDismiss={() => {}}
        duration={0}
      />,
    );
    expect(screen.getByText('Set logged')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalled();
  });
});

describe('TabBar', () => {
  it('marks the active tab and reports selection', () => {
    const onSelect = vi.fn();
    render(
      <TabBar
        items={[
          { key: 'home', label: 'Home', icon: <HomeIcon /> },
          { key: 'settings', label: 'Settings', icon: <HomeIcon /> },
        ]}
        activeKey="home"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button', { name: /Home/ })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: /Settings/ }));
    expect(onSelect).toHaveBeenCalledWith('settings');
  });
});

describe('EmptyState', () => {
  it('renders title, body and action', () => {
    render(<EmptyState title="No workouts" body="Nothing yet" action={<Button>Import</Button>} />);
    expect(screen.getByText('No workouts')).toBeInTheDocument();
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
  });
});

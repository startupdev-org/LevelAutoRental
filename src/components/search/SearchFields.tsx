import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Filter } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface DateRange {
  startDate: string;
  endDate: string;
}

type FieldVariant = 'hero' | 'hero-mobile' | 'cars';

interface DateRangeFieldProps {
  label: string;
  startDate: string;
  endDate: string;
  open: boolean;
  onToggle: () => void;
  onChange: (range: DateRange) => void;
  onRangeComplete?: () => void;
  variant: FieldVariant;
}

interface BudgetFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  variant: FieldVariant;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function formatDisplayDate(value: string, locale: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function calendarCells(monthDate: Date): (string | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toIsoDate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const sunday = new Date(2024, 0, 7 + index);
    return sunday.toLocaleDateString(locale, { weekday: 'short' });
  });
}

function revealCalendarOnMobile(panel: HTMLElement) {
  if (window.matchMedia('(min-width: 1024px)').matches) return;

  const rect = panel.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const topInset = 96;
  const bottomInset = 216;
  const viewportBottom = window.innerHeight - bottomInset;

  if (rect.bottom <= viewportBottom && rect.top >= topInset) return;

  let delta = 0;
  if (rect.bottom > viewportBottom) {
    delta = rect.bottom - viewportBottom;
  }
  if (rect.top - delta < topInset) {
    delta = rect.top - topInset;
  }
  if (delta > 1) {
    window.scrollBy({ top: delta, behavior: 'smooth' });
  }
}

export const DateRangeField: React.FC<DateRangeFieldProps> = ({
  label,
  startDate,
  endDate,
  open,
  onToggle,
  onChange,
  onRangeComplete,
  variant,
}) => {
  const { t } = useTranslation();
  const locale = t('config.date');
  const today = toIsoDate(new Date());
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(startDate) ?? new Date());

  const revealPanel = () => {
    if (!openRef.current || !panelRef.current) return;
    revealCalendarOnMobile(panelRef.current);
  };

  useEffect(() => {
    if (!open) return;
    setVisibleMonth(parseIsoDate(startDate) ?? new Date());
  }, [open, startDate]);

  const hasValue = Boolean(startDate || endDate);
  const displayValue = !startDate
    ? t('search.selectPeriod')
    : !endDate
      ? formatDisplayDate(startDate, locale)
      : `${formatDisplayDate(startDate, locale)} – ${formatDisplayDate(endDate, locale)}`;

  const hint = !startDate
    ? t('search.selectStart')
    : !endDate
      ? t('search.selectEnd')
      : t('search.changePeriod');

  const selectDate = (selectedDate: string) => {
    if (selectedDate < today) return;

    if (!startDate || (startDate && endDate)) {
      if (startDate && endDate && selectedDate > startDate) {
        onChange({ startDate, endDate: selectedDate });
        onRangeComplete?.();
        return;
      }
      onChange({ startDate: selectedDate, endDate: '' });
      return;
    }

    if (selectedDate < startDate) {
      onChange({ startDate: selectedDate, endDate: '' });
      return;
    }

    onChange({ startDate, endDate: selectedDate });
    onRangeComplete?.();
  };

  const shiftMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const wrapperClass = variant === 'hero'
    ? 'flex-1 min-w-0 px-6 py-5 dropdown-container overflow-visible'
    : variant === 'hero-mobile'
      ? 'w-full dropdown-container overflow-visible'
      : 'flex-1 min-w-0 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible';

  const labelClass = variant === 'cars'
    ? `text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${hasValue ? 'text-white' : 'text-white/80'}`
    : 'block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide';

  const triggerClass = variant === 'hero'
    ? `w-full text-sm bg-transparent border-none outline-none cursor-pointer transition-colors pr-8 flex items-center gap-2 ${hasValue ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`
    : variant === 'hero-mobile'
      ? 'w-full text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-xl py-3 px-4 cursor-pointer flex items-center gap-2'
      : `min-w-0 text-base font-medium cursor-pointer transition-colors pr-6 flex items-center gap-2 whitespace-nowrap ${hasValue ? 'text-white' : 'text-white/70'}`;

  const iconClass = variant === 'cars' ? 'w-4 h-4 text-white/70' : 'w-4 h-4 text-gray-400';

  return (
    <div className={wrapperClass}>
      <label className={labelClass}>{label}</label>
      <div className="relative overflow-visible">
        <button type="button" className={`${triggerClass} w-full bg-transparent text-left`} onClick={onToggle}>
          <Calendar className={`${iconClass} flex-shrink-0 ${variant === 'cars' ? 'hidden md:block' : ''}`} />
          <span className="flex-1 truncate text-left">{displayValue}</span>
        </button>
        <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${variant === 'hero-mobile' ? 'right-4' : variant === 'hero' ? 'right-2' : 'right-0'}`}>
          <svg className={`w-4 h-4 ${variant === 'cars' ? 'text-white/60' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onAnimationComplete={revealPanel}
              className={`absolute top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] p-3 ${variant === 'hero-mobile' ? 'left-0 right-0' : 'left-0 w-[320px]'}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-600">{hint}</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-medium text-gray-700">
                  {visibleMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </div>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                {weekdayLabels(locale).map((day) => (
                  <div key={day} className="text-gray-500 font-medium py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells(visibleMonth).map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} />;

                  const isPast = day < today;
                  const isStart = day === startDate;
                  const isEnd = day === endDate;
                  const isInRange = Boolean(startDate && endDate && day > startDate && day < endDate);
                  const isSelected = isStart || isEnd;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isPast}
                      onClick={() => selectDate(day)}
                      className={`h-8 flex items-center justify-center text-xs rounded-xl transition-colors ${
                        isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                            : isInRange
                              ? 'bg-theme-100 text-gray-900 hover:bg-theme-200'
                              : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {Number(day.slice(-2))}
                    </button>
                  );
                })}
              </div>
              {hasValue && (
                <button
                  type="button"
                  onClick={() => onChange({ startDate: '', endDate: '' })}
                  className="mt-3 w-full text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {t('search.clearDates')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const BudgetField: React.FC<BudgetFieldProps> = ({
  label,
  value,
  onChange,
  onFocus,
  variant,
}) => {
  const { t } = useTranslation();
  const hasValue = Boolean(value);

  const wrapperClass = variant === 'hero'
    ? 'flex-1 min-w-0 px-6 py-5 dropdown-container overflow-visible'
    : variant === 'hero-mobile'
      ? 'w-full'
      : 'flex-1 min-w-0 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5';

  const labelClass = variant === 'cars'
    ? `text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${hasValue ? 'text-white' : 'text-white/80'}`
    : 'block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide';

  const inputClass = variant === 'hero'
    ? 'w-full min-w-0 text-sm text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
    : variant === 'hero-mobile'
      ? 'w-full min-w-0 text-sm font-medium text-gray-900 bg-transparent border-none outline-none p-0 placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      : 'w-full min-w-0 text-base font-medium text-white bg-transparent border-none outline-none placeholder:text-white/70 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  const currencyClass = variant === 'cars'
    ? `shrink-0 text-base font-medium leading-none ${hasValue ? 'text-white' : 'text-white/70'}`
    : `shrink-0 text-sm leading-none ${hasValue ? 'text-gray-900' : 'text-gray-400'}`;

  const rowClass = variant === 'hero-mobile'
    ? 'flex items-center gap-2 border border-gray-200 rounded-xl py-3 px-4'
    : 'flex items-center gap-1.5 min-w-0';

  return (
    <div className={wrapperClass}>
      <label className={labelClass}>{label}</label>
      <div className={rowClass}>
        <span className={currencyClass} aria-hidden="true">€</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={t('search.budgetPlaceholder')}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
          className={inputClass}
          aria-label={`${label}, EUR`}
        />
      </div>
    </div>
  );
};

export type SearchMode = 'make' | 'budget';

interface SearchModeTabsProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
  variant: 'hero' | 'cars';
}

export const SearchModeTabs: React.FC<SearchModeTabsProps> = ({ mode, onChange, variant }) => {
  const { t } = useTranslation();
  const options: { id: SearchMode; label: string }[] = [
    { id: 'make', label: t('search.byMake') },
    { id: 'budget', label: t('search.byBudget') },
  ];

  const trackClass = variant === 'cars'
    ? 'inline-flex w-full md:w-fit shrink-0 rounded-2xl bg-black/25 p-1'
    : 'inline-flex w-full md:w-auto rounded-2xl bg-gray-100 p-1';

  return (
    <div className={trackClass} role="tablist">
      {options.map((option) => {
        const active = mode === option.id;
        const buttonClass = variant === 'cars'
          ? active
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-white/80 hover:text-white'
          : active
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-800';

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`flex-1 md:flex-none min-w-[8.5rem] px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${buttonClass}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

interface SearchModeMenuProps {
  mode: SearchMode;
  open: boolean;
  onToggle: () => void;
  onChange: (mode: SearchMode) => void;
}

export const SearchModeMenu: React.FC<SearchModeMenuProps> = ({
  mode,
  open,
  onToggle,
  onChange,
}) => {
  const { t } = useTranslation();
  const options: { id: SearchMode; label: string }[] = [
    { id: 'make', label: t('search.byMake') },
    { id: 'budget', label: t('search.byBudget') },
  ];

  return (
    <div className="relative dropdown-container flex items-center px-4">
      <button
        type="button"
        aria-label={t('search.filter')}
        aria-expanded={open}
        onClick={onToggle}
        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        <Filter className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] py-1"
            onClick={(event) => event.stopPropagation()}
          >
            {options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${index === 0 ? 'rounded-t-2xl' : ''} ${index === options.length - 1 ? 'rounded-b-2xl' : ''} ${
                  mode === option.id ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useEffect, useMemo, useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/BirthDatePicker.css';

const CALENDAR_VIEWS = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year'
};

const getTodayIsoLocalDate = () => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoLocalDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') {
    return null;
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const dateValue = new Date(year, month - 1, day);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue;
};

const formatLocalDateToIso = (dateValue) => {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return '';
  }

  const year = String(dateValue.getFullYear());
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalDateToDisplay = (dateValue) => {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return '';
  }

  const day = String(dateValue.getDate()).padStart(2, '0');
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const year = String(dateValue.getFullYear());
  return `${day}/${month}/${year}`;
};

const formatCalendarMonthLabel = (dateValue) => {
  const monthLabel = dateValue.toLocaleDateString('es-MX', { month: 'long' });
  return monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
};

const formatWeekDayLabel = (weekdayName) => {
  const label = String(weekdayName || '').replace('.', '').slice(0, 2);
  if (!label) {
    return '';
  }
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
};

const normalizeBirthDateInput = (rawValue = '') => {
  const digits = String(rawValue).replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${year}`;
};

const parseBirthDateMasked = (maskedValue) => {
  const match = String(maskedValue || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  const isValidDate = (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );

  return isValidDate ? parsedDate : null;
};

const BirthDateInput = forwardRef(function BirthDateInput(
  { value, onClick, onBlur, onChange, name, id, className, placeholder, disabled, isFilled, autoComplete },
  ref
) {
  return (
    <div className={`alta-date-field-wrap ${disabled ? 'is-disabled' : ''} ${isFilled ? 'is-filled' : ''}`.trim()}>
      <input
        ref={ref}
        type="text"
        id={id}
        name={name}
        value={value || ''}
        onChange={onChange}
        onClick={onClick}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        autoComplete={autoComplete}
        inputMode="numeric"
        maxLength={10}
        data-form-type="other"
        data-lpignore="true"
        spellCheck={false}
        disabled={disabled}
        required
      />
      <button
        type="button"
        className="alta-date-trigger"
        onClick={onClick}
        disabled={disabled}
        aria-label="Abrir calendario"
      >
        <i className='bx bx-calendar'></i>
      </button>
    </div>
  );
});

export default function BirthDatePicker({
  id,
  name,
  value,
  maxIsoDate,
  emptyOpenToIsoDate,
  onChangeIso,
  className,
  autoComplete = 'off',
  required = true,
  disabled = false
}) {
  const [hintActive, setHintActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [calendarView, setCalendarView] = useState(CALENDAR_VIEWS.DAY);

  const defaultOpenIsoDate = useMemo(
    () => emptyOpenToIsoDate || getTodayIsoLocalDate(),
    [emptyOpenToIsoDate]
  );
  const selectedDate = useMemo(() => parseIsoLocalDate(value), [value]);
  const defaultOpenDate = useMemo(
    () => parseIsoLocalDate(defaultOpenIsoDate) || new Date(),
    [defaultOpenIsoDate]
  );
  const maxDate = useMemo(() => parseIsoLocalDate(maxIsoDate), [maxIsoDate]);
  const placeholder = hintActive ? '__/__/____' : 'dd/mm/aaaa';

  useEffect(() => {
    if (isTyping) {
      return;
    }

    if (selectedDate) {
      setInputValue(formatLocalDateToDisplay(selectedDate));
      return;
    }

    setInputValue('');
  }, [selectedDate, isTyping]);

  const emitIso = (isoDate) => {
    if (typeof onChangeIso === 'function') {
      onChangeIso(isoDate);
    }
  };

  const handleDateChange = (dateValue) => {
    setIsTyping(false);
    setInputValue(formatLocalDateToDisplay(dateValue));
    emitIso(formatLocalDateToIso(dateValue));
  };

  const handleRawChange = (event) => {
    const target = event?.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    const normalizedInput = normalizeBirthDateInput(target.value);
    setIsTyping(true);
    setInputValue(normalizedInput);

    if (target.value !== normalizedInput) {
      target.value = normalizedInput;
    }

    if (!normalizedInput) {
      emitIso('');
      return;
    }

    const parsedDate = parseBirthDateMasked(normalizedInput);
    if (!parsedDate) {
      emitIso('');
      return;
    }

    if (maxDate && parsedDate > maxDate) {
      emitIso('');
      return;
    }

    setIsTyping(false);
    setInputValue(formatLocalDateToDisplay(parsedDate));
    emitIso(formatLocalDateToIso(parsedDate));
  };

  const handleBlur = () => {
    setIsTyping(false);
    setHintActive(false);
  };

  const handleCalendarClose = () => {
    setCalendarView(CALENDAR_VIEWS.DAY);
  };

  const handleCalendarSelect = () => {
    if (calendarView === CALENDAR_VIEWS.YEAR) {
      setCalendarView(CALENDAR_VIEWS.MONTH);
      return;
    }

    if (calendarView === CALENDAR_VIEWS.MONTH) {
      setCalendarView(CALENDAR_VIEWS.DAY);
    }
  };

  const openMonthView = (event) => {
    event.preventDefault();
    setCalendarView(CALENDAR_VIEWS.MONTH);
  };

  const openYearView = (event) => {
    event.preventDefault();
    setCalendarView(CALENDAR_VIEWS.YEAR);
  };

  const renderCalendarHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    decreaseYear,
    increaseYear,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
    prevYearButtonDisabled,
    nextYearButtonDisabled
  }) => {
    const isDayView = calendarView === CALENDAR_VIEWS.DAY;
    const isMonthView = calendarView === CALENDAR_VIEWS.MONTH;

    const prevDisabled = isDayView ? prevMonthButtonDisabled : prevYearButtonDisabled;
    const nextDisabled = isDayView ? nextMonthButtonDisabled : nextYearButtonDisabled;

    const handlePrevious = () => {
      if (isDayView) {
        decreaseMonth();
        return;
      }

      decreaseYear();
    };

    const handleNext = () => {
      if (isDayView) {
        increaseMonth();
        return;
      }

      increaseYear();
    };

    return (
      <div className="alta-birth-calendar-header">
        <button
          type="button"
          className="alta-birth-calendar-nav"
          onClick={handlePrevious}
          disabled={prevDisabled}
          aria-label="Anterior"
        >
          <i className='bx bx-chevron-left'></i>
        </button>

        {isDayView && (
          <div className="alta-birth-calendar-header-center is-day">
            <button
              type="button"
              className="alta-birth-calendar-label-btn is-month-label"
              onClick={openMonthView}
            >
              {formatCalendarMonthLabel(date)}
            </button>
            <button
              type="button"
              className="alta-birth-calendar-label-btn is-year-label"
              onClick={openYearView}
            >
              {date.getFullYear()}
            </button>
          </div>
        )}

        {isMonthView && (
          <div className="alta-birth-calendar-header-center is-month">
            <button
              type="button"
              className="alta-birth-calendar-label-btn is-year-label"
              onClick={openYearView}
            >
              {date.getFullYear()}
            </button>
          </div>
        )}

        {!isDayView && !isMonthView && (
          <div className="alta-birth-calendar-header-center is-year">
            <span className="alta-birth-calendar-range-label">{date.getFullYear()}</span>
          </div>
        )}

        <button
          type="button"
          className="alta-birth-calendar-nav"
          onClick={handleNext}
          disabled={nextDisabled}
          aria-label="Siguiente"
        >
          <i className='bx bx-chevron-right'></i>
        </button>
      </div>
    );
  };

  return (
    <div
      className="alta-date-field-container"
      onMouseEnter={() => setHintActive(true)}
      onMouseLeave={() => setHintActive(false)}
    >
      <DatePicker
        id={id}
        name={name}
        selected={selectedDate}
        onChange={handleDateChange}
        onChangeRaw={handleRawChange}
        onBlur={handleBlur}
        onSelect={handleCalendarSelect}
        onCalendarClose={handleCalendarClose}
        locale={es}
        dateFormat="dd/MM/yyyy"
        value={inputValue}
        placeholderText={placeholder}
        autoComplete={autoComplete}
        maxDate={maxDate}
        openToDate={selectedDate || defaultOpenDate}
        popperPlacement="bottom-start"
        popperProps={{ strategy: 'fixed' }}
        showPopperArrow={false}
        formatWeekDay={formatWeekDayLabel}
        fixedHeight
        popperClassName="alta-birth-calendar-popper"
        calendarClassName="alta-birth-calendar"
        wrapperClassName="alta-birth-datepicker-wrapper"
        showMonthYearPicker={calendarView === CALENDAR_VIEWS.MONTH}
        showYearPicker={calendarView === CALENDAR_VIEWS.YEAR}
        yearItemNumber={12}
        shouldCloseOnSelect={calendarView === CALENDAR_VIEWS.DAY}
        required={required}
        disabled={disabled}
        renderCustomHeader={renderCalendarHeader}
        customInput={
          <BirthDateInput
            className={className}
            placeholder={placeholder}
            isFilled={Boolean(value)}
            disabled={disabled}
            autoComplete={autoComplete}
          />
        }
      />
    </div>
  );
}

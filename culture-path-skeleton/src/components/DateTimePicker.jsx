import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const DateTimePicker = ({ value, onChange, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(
    value ? new Date(value).toTimeString().slice(0, 5) : '10:00'
  );

  const today = new Date();
  const minDateTime = minDate ? new Date(minDate) : today;

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const firstDayWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(date);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const selectDate = (date) => {
    if (!date) return;
    
    const dateTime = new Date(date);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    
    setSelectedDate(dateTime);
    onChange(dateTime.toISOString().slice(0, 16));
  };

  const selectTime = (time) => {
    setSelectedTime(time);
    if (selectedDate) {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(dateTime.toISOString().slice(0, 16));
    }
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    return date < minDateTime.setHours(0, 0, 0, 0);
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return 'Select date and time';
    return selectedDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' at ' + selectedTime;
  };

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00'
  ];

  const days = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center">
          <Calendar size={16} className="mr-2 text-muted-foreground" />
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {formatDisplayDate()}
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 p-4"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-semibold text-foreground">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && !isDateDisabled(date) && selectDate(date)}
                disabled={!date || isDateDisabled(date)}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${!date ? 'invisible' : ''}
                  ${isDateDisabled(date) ? 'text-muted-foreground cursor-not-allowed' : 'hover:bg-muted'}
                  ${selectedDate && date && date.toDateString() === selectedDate.toDateString() 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground'
                  }
                  ${date && date.toDateString() === today.toDateString() ? 'font-semibold' : ''}
                `}
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>

          {/* Time Selection */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center mb-3">
              <Clock size={16} className="mr-2 text-muted-foreground" />
              <span className="font-medium text-foreground">Select Time</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => selectTime(time)}
                  className={`
                    p-2 text-sm rounded-lg border transition-colors
                    ${selectedTime === time 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                    }
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              disabled={!selectedDate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DateTimePicker;
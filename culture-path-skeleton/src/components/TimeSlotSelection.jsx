import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';

export const TimeSlotSelection = ({ date, availableSlots, selectedTime, onSubmit }) => {
  const [selected, setSelected] = useState(selectedTime);
  const [error, setError] = useState('');

  const handleTimeSelect = (event, newTime) => {
    setSelected(newTime);
    setError('');
  };

  const handleSubmit = () => {
    if (!selected) {
      setError('Please select a time slot');
      return;
    }
    onSubmit(selected);
  };

  // Group time slots by period (Morning, Afternoon, Evening)
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const hour = parseInt(slot.split(':')[0], 10);
    let period;
    if (hour < 12) period = 'Morning';
    else if (hour < 17) period = 'Afternoon';
    else period = 'Evening';

    if (!acc[period]) acc[period] = [];
    acc[period].push(slot);
    return acc;
  }, {});

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Selected Date: {format(new Date(date), 'dd MMMM yyyy')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {Object.entries(groupedSlots).map(([period, slots]) => (
        <Box key={period} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {period}
          </Typography>
          <ToggleButtonGroup
            value={selected}
            exclusive
            onChange={handleTimeSelect}
            aria-label="time slot selection"
            sx={{ flexWrap: 'wrap' }}
          >
            {slots.map((slot) => (
              <ToggleButton
                key={slot}
                value={slot}
                aria-label={slot}
                sx={{
                  m: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                {format(new Date(`2000-01-01 ${slot}`), 'hh:mm a')}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      ))}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={!selected}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};
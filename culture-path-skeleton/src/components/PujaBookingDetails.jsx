import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { BookingController } from '../controllers/BookingController';
import { useAuth } from '../hooks/useAuth';
import { BookingTimeline } from './BookingTimeline';
import { PujaDetails } from './PujaDetails';
import { DevoteeDetails } from './DevoteeDetails';
import { TimeSlotSelection } from './TimeSlotSelection';
import { PujaRequirements } from './PujaRequirements';
import { PaymentSummary } from './PaymentSummary';

const steps = ['Devotee Details', 'Select Time Slot', 'Additional Requirements', 'Payment Summary'];

export const PujaBookingDetails = ({ puja, temple, selectedDate, selectedTime }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    devoteeDetails: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gotra: '',
      nakshatra: '',
    },
    selectedDate,
    selectedTime,
    requirements: {
      prasadam: false,
      certificate: false,
      photos: false,
      video: false,
      specialPrasadam: false,
      liveStreaming: false,
    },
    offerings: [],
    totalAmount: puja.price,
  });

  const handleDevoteeDetailsSubmit = (details) => {
    setBookingData((prev) => ({
      ...prev,
      devoteeDetails: details,
    }));
    setCurrentStep(2);
  };

  const handleTimeSlotSubmit = async (time) => {
    setBookingData((prev) => ({
      ...prev,
      selectedTime: time,
    }));
    setCurrentStep(3);
  };

  const handleRequirementsSubmit = ({ requirements, offerings, totalAmount }) => {
    setBookingData((prev) => ({
      ...prev,
      requirements,
      offerings,
      totalAmount: puja.price + totalAmount,
    }));
    setCurrentStep(4);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      const bookingData = {
        templeId: temple.id,
        pujaId: puja.id,
        type: 'puja',
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        amount: bookingData.totalAmount,
        serviceName: puja.name,
        userDetails: {
          name: bookingData.devoteeDetails.name,
          email: bookingData.devoteeDetails.email,
          phone: bookingData.devoteeDetails.phone,
        },
        additionalDetails: {
          gotra: bookingData.devoteeDetails.gotra,
          nakshatra: bookingData.devoteeDetails.nakshatra,
          requirements: bookingData.requirements,
          offerings: bookingData.offerings,
        },
      };

      const response = await BookingController.handlePayment(bookingData);
      if (!response.success) {
        throw new Error(response.error || 'Payment failed');
      }

      navigate('/booking-success', {
        state: {
          bookingId: response.booking.id,
          type: 'puja',
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Book {puja.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={currentStep - 1} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {currentStep === 1 && (
            <>
              <Typography variant="h5" gutterBottom>
                Devotee Details
              </Typography>
              <DevoteeDetails
                initialValues={bookingData.devoteeDetails}
                onSubmit={handleDevoteeDetailsSubmit}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              <Typography variant="h5" gutterBottom>
                Select Time Slot
              </Typography>
              <TimeSlotSelection
                date={selectedDate}
                availableSlots={temple.availableSlots}
                selectedTime={bookingData.selectedTime}
                onSubmit={handleTimeSlotSubmit}
              />
            </>
          )}

          {currentStep === 3 && (
            <>
              <Typography variant="h5" gutterBottom>
                Additional Requirements
              </Typography>
              <PujaRequirements
                onSubmit={handleRequirementsSubmit}
                initialValues={{
                  requirements: bookingData.requirements,
                  offerings: bookingData.offerings,
                }}
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              <Typography variant="h5" gutterBottom>
                Payment Summary
              </Typography>
              <PaymentSummary
                pujaDetails={puja}
                devoteeDetails={bookingData.devoteeDetails}
                selectedDate={selectedDate}
                selectedTime={bookingData.selectedTime}
                requirements={bookingData.requirements}
                offerings={bookingData.offerings}
                totalAmount={bookingData.totalAmount}
                baseAmount={puja.price}
                onConfirm={handlePayment}
                loading={loading}
              />
            </>
          )}
        </Box>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          {currentStep > 1 && (
            <Button
              variant="outlined"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={loading}
            >
              Back
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};
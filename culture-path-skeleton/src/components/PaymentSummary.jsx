import React from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { format } from 'date-fns';

export const PaymentSummary = ({
  pujaDetails,
  devoteeDetails,
  selectedDate,
  selectedTime,
  requirements,
  offerings,
  totalAmount,
  baseAmount,
  onConfirm,
  loading,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Booking Summary
        </Typography>

        <Grid container spacing={3}>
          {/* Puja Details */}
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" gutterBottom>
              {pujaDetails.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {pujaDetails.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Devotee Details */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Devotee Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Name"
                  secondary={devoteeDetails.name}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={devoteeDetails.email}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Phone"
                  secondary={devoteeDetails.phone}
                />
              </ListItem>
              {devoteeDetails.gotra && (
                <ListItem>
                  <ListItemText
                    primary="Gotra"
                    secondary={devoteeDetails.gotra}
                  />
                </ListItem>
              )}
              {devoteeDetails.nakshatra && (
                <ListItem>
                  <ListItemText
                    primary="Nakshatra"
                    secondary={devoteeDetails.nakshatra}
                  />
                </ListItem>
              )}
            </List>
          </Grid>

          {/* Date and Time */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Schedule Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Date"
                  secondary={format(new Date(selectedDate), 'dd MMMM yyyy')}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Time"
                  secondary={format(new Date(`2000-01-01 ${selectedTime}`), 'hh:mm a')}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Requirements */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Requirements
            </Typography>
            <List dense>
              {Object.entries(requirements)
                .filter(([_, isSelected]) => isSelected)
                .map(([key]) => (
                  <ListItem key={key}>
                    <ListItemText
                      primary={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  </ListItem>
                ))}
            </List>
          </Grid>

          {/* Additional Offerings */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" gutterBottom>
              Additional Offerings
            </Typography>
            <List dense>
              {offerings.map((offering) => (
                <ListItem key={offering.name}>
                  <ListItemText
                    primary={offering.name}
                    secondary={formatCurrency(offering.price)}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Payment Details */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Payment Details
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Base Amount</Typography>
                    <Typography>{formatCurrency(baseAmount)}</Typography>
                  </Box>
                </Grid>
                {offerings.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Additional Offerings</Typography>
                      <Typography>
                        {formatCurrency(
                          offerings.reduce((sum, item) => sum + item.price, 0)
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: 1,
                      borderColor: 'divider',
                      pt: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="h6">Total Amount</Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(totalAmount)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
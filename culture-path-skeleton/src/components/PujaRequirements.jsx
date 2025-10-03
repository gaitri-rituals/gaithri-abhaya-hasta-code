import React, { useState } from 'react';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
} from '@mui/material';

const defaultRequirements = {
  prasadam: false,
  certificate: false,
  photos: false,
  video: false,
  specialPrasadam: false,
  liveStreaming: false,
};

const additionalOfferings = {
  coconut: { name: 'Coconut', price: 51 },
  flowers: { name: 'Flowers', price: 101 },
  fruits: { name: 'Fruits', price: 151 },
  sweets: { name: 'Sweets', price: 201 },
  lamp: { name: 'Special Lamp', price: 301 },
  archana: { name: 'Special Archana', price: 501 },
};

export const PujaRequirements = ({ onSubmit, initialValues = {} }) => {
  const [requirements, setRequirements] = useState({
    ...defaultRequirements,
    ...initialValues.requirements,
  });
  const [offerings, setOfferings] = useState(initialValues.offerings || {});

  const handleRequirementChange = (event) => {
    setRequirements({
      ...requirements,
      [event.target.name]: event.target.checked,
    });
  };

  const handleOfferingChange = (event) => {
    setOfferings({
      ...offerings,
      [event.target.name]: event.target.checked,
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(offerings).forEach(([key, isSelected]) => {
      if (isSelected) {
        total += additionalOfferings[key].price;
      }
    });
    return total;
  };

  const handleSubmit = () => {
    const selectedOfferings = Object.entries(offerings)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => ({
        name: additionalOfferings[key].name,
        price: additionalOfferings[key].price,
      }));

    onSubmit({
      requirements,
      offerings: selectedOfferings,
      totalAmount: calculateTotal(),
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Requirements
        </Typography>
        <FormGroup>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.prasadam}
                    onChange={handleRequirementChange}
                    name="prasadam"
                  />
                }
                label="Prasadam"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.certificate}
                    onChange={handleRequirementChange}
                    name="certificate"
                  />
                }
                label="Puja Certificate"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.photos}
                    onChange={handleRequirementChange}
                    name="photos"
                  />
                }
                label="Photos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.video}
                    onChange={handleRequirementChange}
                    name="video"
                  />
                }
                label="Video Recording"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.specialPrasadam}
                    onChange={handleRequirementChange}
                    name="specialPrasadam"
                  />
                }
                label="Special Prasadam"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={requirements.liveStreaming}
                    onChange={handleRequirementChange}
                    name="liveStreaming"
                  />
                }
                label="Live Streaming"
              />
            </Grid>
          </Grid>
        </FormGroup>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Additional Offerings
        </Typography>
        <FormGroup>
          <Grid container spacing={2}>
            {Object.entries(additionalOfferings).map(([key, { name, price }]) => (
              <Grid item xs={12} sm={6} key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offerings[key] || false}
                      onChange={handleOfferingChange}
                      name={key}
                    />
                  }
                  label={`${name} (₹${price})`}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Total Additional Amount: ₹{calculateTotal()}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};
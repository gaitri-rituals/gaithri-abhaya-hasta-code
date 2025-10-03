import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';

export const DevoteeDetails = ({ initialValues, onSubmit }) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!formData.gotra) newErrors.gotra = 'Gotra is required';
    if (!formData.nakshatra) newErrors.nakshatra = 'Nakshatra is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRequirementChange = (requirement) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter((r) => r !== requirement)
        : [...prev.requirements, requirement],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  const commonRequirements = [
    'Flowers',
    'Fruits',
    'Coconut',
    'Betel Leaves',
    'Kumkum',
    'Turmeric',
    'Rice',
    'Ghee',
  ];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gotra"
            name="gotra"
            value={formData.gotra}
            onChange={handleChange}
            error={!!errors.gotra}
            helperText={errors.gotra}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Nakshatra"
            name="nakshatra"
            value={formData.nakshatra}
            onChange={handleChange}
            error={!!errors.nakshatra}
            helperText={errors.nakshatra}
            required
          />
        </Grid>
      </Grid>

      <FormControl component="fieldset" sx={{ mt: 4 }}>
        <FormLabel component="legend">Select Required Items</FormLabel>
        <FormGroup>
          <Grid container spacing={2}>
            {commonRequirements.map((requirement) => (
              <Grid item xs={6} sm={4} key={requirement}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requirements.includes(requirement)}
                      onChange={() => handleRequirementChange(requirement)}
                    />
                  }
                  label={requirement}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
      </FormControl>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" color="primary" size="large">
          Continue
        </Button>
      </Box>
    </Box>
  );
};
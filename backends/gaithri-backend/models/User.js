import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['super_admin', 'temple_admin', 'staff', 'vendor'],
    default: 'staff'
  },
  templeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Temple',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  permissions: [{
    type: String,
    enum: [
      'manage_temples',
      'manage_rituals',
      'manage_events',
      'manage_vendors',
      'manage_staff',
      'view_analytics',
      'manage_store',
      'manage_classes'
    ]
  }],
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = [
          'manage_temples',
          'manage_rituals',
          'manage_events',
          'manage_vendors',
          'manage_staff',
          'view_analytics',
          'manage_store',
          'manage_classes'
        ];
        break;
      case 'temple_admin':
        this.permissions = [
          'manage_rituals',
          'manage_events',
          'manage_vendors',
          'manage_staff',
          'view_analytics',
          'manage_store',
          'manage_classes'
        ];
        break;
      case 'staff':
        this.permissions = [
          'manage_rituals',
          'manage_events',
          'view_analytics'
        ];
        break;
      case 'vendor':
        this.permissions = [
          'view_analytics'
        ];
        break;
    }
  }
  next();
});

export default mongoose.model('User', userSchema);

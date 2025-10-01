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
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profileImage: {
    type: String,
    default: ''
  },
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'temple', 'other'],
      default: 'home'
    },
    label: String,
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'kn', 'ml'],
      default: 'en'
    },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    bookingReminders: {
      type: Boolean,
      default: true
    }
  },
  devotionalInfo: {
    favoriteDeities: [String],
    preferredTemples: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Temple'
    }],
    frequentPujas: [String],
    specialDates: [{
      name: String,
      date: String, // MM-DD format
      isLunar: { type: Boolean, default: false }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String,
  refreshTokenExpire: Date,
  lastLogin: Date,
  deviceTokens: [String] // For push notifications
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Ensure only one default address
userSchema.pre('save', function(next) {
  const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
  if (defaultAddresses.length > 1) {
    // Keep only the first default address
    this.addresses.forEach((addr, index) => {
      if (addr.isDefault && index > 0) {
        addr.isDefault = false;
      }
    });
  }
  next();
});

export default mongoose.model('User', userSchema);

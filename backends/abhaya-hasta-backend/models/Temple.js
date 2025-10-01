import mongoose from 'mongoose';

const templeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Temple name is required'],
    trim: true,
    maxlength: [200, 'Temple name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Temple description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  address: {
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
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    website: String
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  timings: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    openTime: String,
    closeTime: String,
    isHoliday: {
      type: Boolean,
      default: false
    }
  }],
  deity: {
    primary: {
      type: String,
      required: true
    },
    secondary: [String]
  },
  facilities: [{
    type: String,
    enum: [
      'Parking',
      'Wheelchair Accessible',
      'Restrooms',
      'Gift Shop',
      'Food Court',
      'Library',
      'Guest House',
      'Community Hall',
      'Online Booking',
      'Live Streaming'
    ]
  }],
  services: {
    pujas: [{
      name: String,
      description: String,
      duration: Number, // in minutes
      price: Number,
      category: {
        type: String,
        enum: ['Daily', 'Special', 'Festival', 'Personal']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    classes: [{
      name: String,
      description: String,
      instructor: String,
      schedule: String,
      fee: Number,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    events: [{
      name: String,
      description: String,
      date: Date,
      duration: Number,
      isRecurring: {
        type: Boolean,
        default: false
      }
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  qrCode: {
    type: String,
    unique: true
  },
  donationUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['Ancient', 'Modern', 'Heritage', 'Pilgrimage', 'Local'],
    default: 'Local'
  }
}, {
  timestamps: true
});

// Generate QR code before saving
templeSchema.pre('save', function(next) {
  if (!this.qrCode) {
    this.qrCode = `TEMPLE-${this._id.toString().slice(-8).toUpperCase()}`;
  }
  
  if (!this.donationUrl) {
    this.donationUrl = `https://abhayahasta.com/temple/${this._id}/donate`;
  }
  
  next();
});

export default mongoose.model('Temple', templeSchema);

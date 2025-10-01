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
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: {
      type: String,
      default: ''
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
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
    openTime: {
      type: String,
      required: true
    },
    closeTime: {
      type: String,
      required: true
    },
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
    secondary: [{
      type: String
    }]
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
      'Community Hall'
    ]
  }],
  qrCode: {
    type: String,
    unique: true
  },
  donationUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    this.donationUrl = `https://donate.abhaya.temple/${this._id}`;
  }
  
  next();
});

// Ensure only one primary image
templeSchema.pre('save', function(next) {
  const primaryImages = this.images.filter(img => img.isPrimary);
  if (primaryImages.length > 1) {
    // Keep only the first primary image
    this.images.forEach((img, index) => {
      if (img.isPrimary && index > 0) {
        img.isPrimary = false;
      }
    });
  }
  next();
});

export default mongoose.model('Temple', templeSchema);

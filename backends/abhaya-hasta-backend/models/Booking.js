import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  temple: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Temple',
    required: true
  },
  type: {
    type: String,
    enum: ['puja', 'class', 'event'],
    required: true
  },
  service: {
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    duration: Number // in minutes
  },
  scheduledDateTime: {
    type: Date,
    required: true
  },
  participants: [{
    name: {
      type: String,
      required: true
    },
    age: Number,
    relation: String
  }],
  specialRequests: {
    type: String,
    maxlength: 500
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  paymentDetails: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    method: {
      type: String,
      enum: ['razorpay', 'paytm', 'upi', 'card', 'cash'],
      required: true
    },
    transactionId: String,
    razorpayPaymentId: String,
    razorpayOrderId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  qrCode: String,
  ticketNumber: {
    type: String,
    unique: true
  },
  notes: String,
  rating: {
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
bookingSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.ticketNumber = `TKT-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);

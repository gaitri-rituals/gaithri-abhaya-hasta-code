const { jest } = require('@jest/globals');
const {
  getDashboardStats,
  getTemples,
  updateTempleStatus,
  getUsers,
  getBookings
} = require('../../controllers/adminController.js');
const dbHelpers = require('../../utils/dbHelpers.js');

// Mock the database helpers
jest.mock('../../utils/dbHelpers.js');

describe('Admin Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 1, role: 'admin' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        bookings: [{ booking_status: 'confirmed', count: 5, total_amount: 1000 }],
        temples: [{ status: 'active', count: 3 }],
        users: [{ role: 'user', count: 10 }],
        recentBookings: [{ id: 1, temple_name: 'Temple 1' }]
      };

      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockStats.bookings)
        .mockResolvedValueOnce(mockStats.temples)
        .mockResolvedValueOnce(mockStats.users)
        .mockResolvedValueOnce(mockStats.recentBookings);

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          bookings_stats: mockStats.bookings,
          temples_stats: mockStats.temples,
          users_stats: mockStats.users,
          recent_bookings: mockStats.recentBookings
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      dbHelpers.executeQuery.mockRejectedValue(error);

      await getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message
      });
    });
  });
});
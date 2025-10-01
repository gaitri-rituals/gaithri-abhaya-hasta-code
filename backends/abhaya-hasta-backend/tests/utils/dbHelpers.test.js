import { jest } from '@jest/globals';
import {
  executeQuery,
  startTransaction,
  buildWhereClause,
  buildPagination,
  validateSort,
  formatPaginatedResponse,
  handleDatabaseError
} from '../../utils/dbHelpers.js';
import pool from '../../config/database.js';

// Mock the database pool
jest.mock('../../config/database.js', () => ({
  connect: jest.fn(),
  query: jest.fn()
}));

describe('Database Helpers', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('should execute query successfully with transaction', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      mockClient.query.mockResolvedValue(mockResult);

      const result = await executeQuery({
        text: 'SELECT * FROM users WHERE id = $1',
        values: [1],
        client: mockClient
      });

      expect(result).toEqual(mockResult.rows);
      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE id = $1',
        values: [1]
      });
    });

    it('should execute query successfully without transaction', async () => {
      const mockResult = { rows: [{ id: 1 }] };
      pool.query.mockResolvedValue(mockResult);

      const result = await executeQuery({
        text: 'SELECT * FROM users WHERE id = $1',
        values: [1]
      });

      expect(result).toEqual(mockResult.rows);
      expect(pool.query).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE id = $1',
        values: [1]
      });
    });

    it('should handle query errors', async () => {
      const error = new Error('Database error');
      mockClient.query.mockRejectedValue(error);

      await expect(executeQuery({
        text: 'SELECT * FROM invalid_table',
        client: mockClient
      })).rejects.toThrow('Database error');
    });
  });

  describe('startTransaction', () => {
    it('should start a transaction successfully', async () => {
      const transaction = await startTransaction();

      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(transaction).toHaveProperty('commit');
      expect(transaction).toHaveProperty('rollback');
      expect(transaction).toHaveProperty('client');
    });

    it('should commit transaction successfully', async () => {
      const transaction = await startTransaction();
      await transaction.commit();

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction successfully', async () => {
      const transaction = await startTransaction();
      await transaction.rollback();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('buildWhereClause', () => {
    it('should build where clause with single filter', () => {
      const filters = { status: 'active' };
      const result = buildWhereClause(filters);

      expect(result).toEqual({
        whereClause: 'status = $1',
        bindings: ['active']
      });
    });

    it('should build where clause with multiple filters', () => {
      const filters = {
        status: 'active',
        role: 'user'
      };
      const result = buildWhereClause(filters);

      expect(result).toEqual({
        whereClause: 'status = $1 AND role = $2',
        bindings: ['active', 'user']
      });
    });

    it('should handle empty filters', () => {
      const result = buildWhereClause({});

      expect(result).toEqual({
        whereClause: '1=1',
        bindings: []
      });
    });

    it('should handle null and undefined values', () => {
      const filters = {
        status: 'active',
        role: null,
        name: undefined
      };
      const result = buildWhereClause(filters);

      expect(result).toEqual({
        whereClause: 'status = $1',
        bindings: ['active']
      });
    });
  });

  describe('buildPagination', () => {
    it('should build pagination with default values', () => {
      const result = buildPagination({});

      expect(result).toEqual({
        limit: 10,
        offset: 0,
        page: 1
      });
    });

    it('should build pagination with custom values', () => {
      const result = buildPagination({
        page: 2,
        limit: 20
      });

      expect(result).toEqual({
        limit: 20,
        offset: 20,
        page: 2
      });
    });

    it('should handle invalid values', () => {
      const result = buildPagination({
        page: -1,
        limit: 0
      });

      expect(result).toEqual({
        limit: 10,
        offset: 0,
        page: 1
      });
    });
  });

  describe('validateSort', () => {
    it('should validate sort with default values', () => {
      const result = validateSort({});

      expect(result).toEqual({
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });
    });

    it('should validate sort with custom values', () => {
      const result = validateSort({
        sort_by: 'name',
        sort_order: 'asc'
      });

      expect(result).toEqual({
        sortBy: 'name',
        sortOrder: 'ASC'
      });
    });

    it('should handle invalid sort order', () => {
      const result = validateSort({
        sort_by: 'name',
        sort_order: 'invalid'
      });

      expect(result).toEqual({
        sortBy: 'name',
        sortOrder: 'DESC'
      });
    });
  });

  describe('formatPaginatedResponse', () => {
    it('should format paginated response', () => {
      const records = [{ id: 1 }, { id: 2 }];
      const total = '10';
      const pagination = { page: 2, limit: 2 };

      const result = formatPaginatedResponse(records, total, pagination);

      expect(result).toEqual({
        success: true,
        data: {
          records: records,
          pagination: {
            page: 2,
            limit: 2,
            total: 10,
            pages: 5
          }
        }
      });
    });

    it('should handle empty records', () => {
      const result = formatPaginatedResponse([], '0', { page: 1, limit: 10 });

      expect(result).toEqual({
        success: true,
        data: {
          records: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        }
      });
    });
  });

  describe('handleDatabaseError', () => {
    it('should handle unique constraint violation', () => {
      const error = new Error('duplicate key value violates unique constraint');
      error.code = '23505';

      const result = handleDatabaseError(error);

      expect(result).toEqual({
        status: 400,
        success: false,
        message: 'Duplicate entry found',
        error: error.message
      });
    });

    it('should handle foreign key violation', () => {
      const error = new Error('foreign key violation');
      error.code = '23503';

      const result = handleDatabaseError(error);

      expect(result).toEqual({
        status: 400,
        success: false,
        message: 'Referenced record not found',
        error: error.message
      });
    });

    it('should handle general database error', () => {
      const error = new Error('Database error');

      const result = handleDatabaseError(error);

      expect(result).toEqual({
        status: 500,
        success: false,
        message: 'Database error occurred',
        error: error.message
      });
    });
  });
});
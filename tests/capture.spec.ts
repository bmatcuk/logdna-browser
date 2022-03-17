import { captureMessage, captureError, internalErrorLogger } from '../src/capture';
import * as bufferManager from '../src/buffer-manager';
import * as init from '../src/init';
import { DEFAULT_CONFIG } from '../src/constants';

const process = jest.spyOn(bufferManager, 'process').mockImplementationOnce(async () => {});

describe('capture.ts', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('captureMessage', () => {
    it('should return without calling process is sending is disabled', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => true);
      captureMessage({
        message: 'Testing',
        level: 'log',
      });
      expect(process).toHaveBeenCalledTimes(0);
    });

    it('should call process when sending is enabled', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => false);
      captureMessage({
        message: 'Testing',
        level: 'log',
      });
      expect(process).toHaveBeenCalledTimes(1);
    });

    it('should generate a logdna logline', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => false);

      captureMessage({
        message: 'Testing',
        level: 'log',
      });
      expect(process).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        app: expect.any(String),
        line: 'Testing',
        level: 'log',
        meta: expect.any(Object),
      });
    });

    it('should generate an error context when message is an error', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementation(() => false);

      const error = new Error('Error Message');
      captureMessage({
        message: error,
        level: 'log',
      });
      expect(process).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        app: expect.any(String),
        line: 'Error Message',
        level: 'error',
        meta: expect.any(Object),
      });
    });

    it('should call any beforeSend hooks when defined', () => {
      const hook = jest.fn(data => data);
      DEFAULT_CONFIG.hooks = {
        beforeSend: [hook],
      };
      captureMessage({
        message: 'Testing',
        level: 'log',
      });
      expect(hook).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledTimes(1);
    });
  });

  describe('captureError', () => {
    it('should return without calling process is sending is disabled', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => true);
      const error = new Error('Error Message');
      captureError(error);
      expect(process).toHaveBeenCalledTimes(0);
    });

    it('should call process when sending is enabled', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => false);
      const error = new Error('Error Message');
      captureError(error);
      expect(process).toHaveBeenCalledTimes(1);
    });

    it('should generate an error context when message is an error', () => {
      jest.spyOn(init, 'isSendingDisabled').mockImplementationOnce(() => false);

      const error = new Error('Error Message');
      captureError(error);

      expect(process).toHaveBeenCalledTimes(1);
      expect(process).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        app: expect.any(String),
        line: 'Error Message',
        level: 'error',
        meta: expect.any(Object),
      });
    });
  });
  describe('internalErrorLogger', () => {
    console.error = jest.fn();

    it('should log out to console error when default logger', () => {
      internalErrorLogger('My Internal Message');
      expect(console.error).toHaveBeenCalledWith('My Internal Message', { isLogDNAMessage: true });
    });

    it('should log out to console error all arguments when default logger', () => {
      internalErrorLogger('My Internal Message', 'Another', 'And Another');
      expect(console.error).toHaveBeenCalledWith('My Internal Message', 'Another', 'And Another', { isLogDNAMessage: true });
    });

    it('should call custom logger when defined', () => {
      DEFAULT_CONFIG.internalErrorLogger = jest.fn();

      internalErrorLogger('My Internal Message');
      expect(DEFAULT_CONFIG.internalErrorLogger).toHaveBeenCalledWith('My Internal Message');
      expect(console.error).toHaveBeenCalledTimes(0);
    });
  });
});
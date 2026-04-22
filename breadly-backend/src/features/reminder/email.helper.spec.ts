import { SESClient } from '@aws-sdk/client-ses';
import { loadTemplate, interpolate, sendEmail, setSesClient } from './email.helper.js';

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('<html>Hello {{userName}}, visit {{appUrl}}</html>'),
}));

describe('email.helper', () => {
  describe('interpolate', () => {
    it('replaces all variables in template', () => {
      const template = 'Hello {{userName}}, visit {{appUrl}} for recipes.';
      const result = interpolate(template, {
        userName: 'Alice',
        appUrl: 'https://breadly.app',
      });
      expect(result).toBe('Hello Alice, visit https://breadly.app for recipes.');
    });

    it('leaves unmatched variables as-is', () => {
      const template = 'Hello {{userName}}, your code is {{code}}.';
      const result = interpolate(template, { userName: 'Bob' });
      expect(result).toBe('Hello Bob, your code is {{code}}.');
    });

    it('handles template with no variables', () => {
      const template = 'No variables here.';
      const result = interpolate(template, { userName: 'Alice' });
      expect(result).toBe('No variables here.');
    });
  });

  describe('loadTemplate', () => {
    it('reads the correct template file', () => {
      const html = loadTemplate('greeting');
      expect(html).toContain('{{userName}}');
    });
  });

  describe('sendEmail', () => {
    const mockSend = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      const mockClient = { send: mockSend } as unknown as SESClient;
      setSesClient(mockClient);
    });

    it('calls SES with correct parameters', async () => {
      mockSend.mockResolvedValueOnce({});

      await sendEmail({
        to: 'alice@example.com',
        subject: 'Test Subject',
        htmlBody: '<html>Hello</html>',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Destination.ToAddresses).toEqual(['alice@example.com']);
      expect(command.input.Message.Subject.Data).toBe('Test Subject');
      expect(command.input.Message.Body.Html.Data).toBe('<html>Hello</html>');
    });

    it('propagates SES errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('SES error'));

      await expect(
        sendEmail({
          to: 'alice@example.com',
          subject: 'Test',
          htmlBody: '<html></html>',
        }),
      ).rejects.toThrow('SES error');
    });
  });
});

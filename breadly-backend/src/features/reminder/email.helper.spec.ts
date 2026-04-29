import { SESClient } from '@aws-sdk/client-ses';
import {
  loadTemplate,
  interpolate,
  sendEmail,
  generateTextBody,
  setSesClient,
} from './email.helper.js';

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

  describe('generateTextBody', () => {
     it('strips HTML tags', () => {
       const result = generateTextBody('<p>Hello</p><p>World</p>');
       expect(result).toBe('Hello World');
       });

     it('removes style blocks', () => {
       const result = generateTextBody('<style>body{margin:0}</style><p>Text</p>');
       expect(result).toBe('Text');
       });

     it('removes script blocks', () => {
       const result = generateTextBody('<script>alert(1)</script><p>Text</p>');
       expect(result).toBe('Text');
       });

      it('replaces HTML entities with spaces', () => {
        const result = generateTextBody('&amp;&quot;');
        expect(result).toBe('');
      });

     it('collapses multiple whitespace', () => {
       const result = generateTextBody('<p>  Hello    World  </p>');
       expect(result).toBe('Hello World');
       });

     it('handles empty input', () => {
       const result = generateTextBody('');
       expect(result).toBe('');
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
      expect(command.input.Message.Body.Text.Data).toBe('Hello');
      expect(command.input.From.Email).toContain('@');
      });

    it('includes ConfigurationSetName when SES_CONFIGURATION_SET is set', async () => {
      mockSend.mockResolvedValueOnce({});
      process.env['SES_CONFIGURATION_SET'] = 'breadly-dev';

      try {
        await sendEmail({
          to: 'alice@example.com',
          subject: 'Test',
          htmlBody: '<html></html>',
        });

        const command = mockSend.mock.calls[0][0];
        expect(command.input.ConfigurationSetName).toBe('breadly-dev');
      } finally {
        delete process.env['SES_CONFIGURATION_SET'];
      }
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

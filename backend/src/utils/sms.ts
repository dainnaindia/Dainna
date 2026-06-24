import dotenv from 'dotenv';
dotenv.config();

export interface SendSMSParams {
  to: string;
  message: string;
  templateId?: string;
}

/**
 * Sends an SMS to the specified recipient using the configured SMS provider.
 * If credentials are not set or the provider is 'console', it logs the message output.
 */
export async function sendSMS({ to, message, templateId }: SendSMSParams): Promise<{ success: boolean; data?: any; error?: string }> {
  const provider = process.env.SMS_PROVIDER || 'console';
  const cleanTo = to.trim();

  if (!cleanTo) {
    console.warn('[SMS Warning] Recipient phone number is empty.');
    return { success: false, error: 'Recipient phone number is empty.' };
  }

  console.log(`[SMS Logger] Routing message via provider: ${provider} to: ${cleanTo}`);

  switch (provider.toLowerCase()) {
    case 'twilio': {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_FROM_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        const errorMsg = 'Twilio credentials (SID, Token, or From Number) are not configured in environment.';
        console.warn(`[SMS Warning] ${errorMsg} Simulating below:`);
        console.log(`[Twilio Simulation] To: ${cleanTo} | Msg: ${message}`);
        return { success: true, data: 'Twilio simulation success' };
      }

      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const body = new URLSearchParams({
          To: cleanTo,
          From: fromNumber,
          Body: message
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        const data: any = await response.json();
        if (response.ok) {
          console.log(`[SMS] Twilio message sent successfully to ${cleanTo}. SID: ${data.sid}`);
          return { success: true, data };
        } else {
          console.error(`[SMS Error] Twilio error:`, data);
          return { success: false, error: data.message || 'Twilio response error' };
        }
      } catch (err: any) {
        console.error(`[SMS Error] Twilio exception:`, err);
        return { success: false, error: err.message };
      }
    }

    case 'fast2sms': {
      const apiKey = process.env.FAST2SMS_API_KEY;

      if (!apiKey) {
        const errorMsg = 'Fast2SMS API key is not configured in environment.';
        console.warn(`[SMS Warning] ${errorMsg} Simulating below:`);
        console.log(`[Fast2SMS Simulation] To: ${cleanTo} | Msg: ${message}`);
        return { success: true, data: 'Fast2SMS simulation success' };
      }

      try {
        // Using Fast2SMS Bulk V2 Quick Send route
        const url = 'https://www.fast2sms.com/dev/bulkV2';
        const params = new URLSearchParams({
          authorization: apiKey,
          route: 'q',
          message: message,
          flash: '0',
          numbers: cleanTo
        });

        const response = await fetch(`${url}?${params.toString()}`, {
          method: 'GET'
        });

        const data: any = await response.json();
        if (response.ok && data.return === true) {
          console.log(`[SMS] Fast2SMS message sent successfully to ${cleanTo}.`);
          return { success: true, data };
        } else {
          console.error(`[SMS Error] Fast2SMS error:`, data);
          return { success: false, error: data.message || 'Fast2SMS response error' };
        }
      } catch (err: any) {
        console.error(`[SMS Error] Fast2SMS exception:`, err);
        return { success: false, error: err.message };
      }
    }

    case 'msg91': {
      const authKey = process.env.MSG91_AUTH_KEY;
      const senderId = process.env.MSG91_SENDER_ID || 'DAINNA';
      const actualTemplateId = templateId || process.env.MSG91_TEMPLATE_ID;

      if (!authKey || !actualTemplateId) {
        const errorMsg = 'MSG91 API credentials (AuthKey or TemplateID) are not configured in environment.';
        console.warn(`[SMS Warning] ${errorMsg} Simulating below:`);
        console.log(`[MSG91 Simulation] To: ${cleanTo} | Msg: ${message} | TemplateID: ${actualTemplateId}`);
        return { success: true, data: 'MSG91 simulation success' };
      }

      try {
        // Msg91 Flow API URL
        const url = 'https://api.msg91.com/api/v5/flow/';
        const body = {
          template_id: actualTemplateId,
          sender: senderId,
          recipients: [
            {
              mobiles: cleanTo,
              // Map template variables if msg91 requires parameters
              message: message
            }
          ]
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': authKey
          },
          body: JSON.stringify(body)
        });

        const data: any = await response.json();
        if (response.ok && data.type === 'success') {
          console.log(`[SMS] MSG91 message sent successfully to ${cleanTo}.`);
          return { success: true, data };
        } else {
          console.error(`[SMS Error] MSG91 error:`, data);
          return { success: false, error: data.message || 'MSG91 response error' };
        }
      } catch (err: any) {
        console.error(`[SMS Error] MSG91 exception:`, err);
        return { success: false, error: err.message };
      }
    }

    case 'console':
    default: {
      console.log(`====================== SIMULATED SMS ======================`);
      console.log(`TO      : ${cleanTo}`);
      console.log(`MESSAGE : ${message}`);
      console.log(`===========================================================`);
      return { success: true, data: 'Simulated log success' };
    }
  }
}

import axios from 'axios';

// Vercel handles env vars natively

const API_VERSION = 'v19.0';

/**
 * Send a WhatsApp message using a pre-approved template.
 * @param {string} templateName
 * @param {string} phoneNumber
 * @param {Array} dynamicData
 * @param {string} headerImageUrl - Optional image URL for templates with image headers
 */
export const sendWhatsAppMessage = async (templateName, phoneNumber, dynamicData = [], headerImageUrl = null) => {
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const TEMPLATE_LANG = (process.env.WHATSAPP_TEMPLATE_LANG || 'en_US').trim();
  const T_NAME = templateName?.trim();
  
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('CRITICAL: WhatsApp API credentials missing from environment.');
    return { success: false, error: 'WhatsApp API Configuration Missing (Token or ID)' };
  }
  
  const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    // Basic phone validation
    const cleanedPhone = phoneNumber?.replace(/\D/g, ''); 
    if (!cleanedPhone || cleanedPhone.length < 10) {
      console.error(`Invalid phone number: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    let components = [];

    // Safety: if template is hello_world, do not send variables
    if (T_NAME !== 'hello_world') {
      // Header Image (if provided)
      if (headerImageUrl) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: headerImageUrl.trim()
              }
            }
          ]
        });
      }

      // Body parameters
      if (dynamicData.length > 0) {
        components.push({
          type: 'body',
          parameters: dynamicData.map(val => ({
            type: 'text',
            text: String(val)
          }))
        });
      }
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanedPhone,
      type: 'template',
      template: {
        name: T_NAME,
        language: { code: TEMPLATE_LANG },
        components: components
      }
    };

    // DEBUG: Log the payload without the token
    console.log('--- WhatsApp API Payload ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('---------------------------');

    const response = await axios.post(BASE_URL, payload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`WhatsApp message sent successfully to ${phoneNumber}. Message ID: ${response.data.messages[0].id}`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    console.error(`Failed to send WhatsApp message to ${phoneNumber}:`, JSON.stringify(errorDetails, null, 2));
    return { success: false, error: errorDetails };
  }
};

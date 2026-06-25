
const API_VERSION = 'v19.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

async function listTemplates() {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('Missing credentials in environment.');
    return;
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/message_templates`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const data = await response.json();

    if (data.error) {
       console.error('Meta API Error:', JSON.stringify(data.error, null, 2));
       return;
    }

    console.log('--- Available Templates for this Phone Number ID ---');
    if (!data.data || data.data.length === 0) {
      console.log('No templates found. Check if you are using the correct Phone Number ID.');
    } else {
      data.data.forEach(t => {
        console.log(`Name: ${t.name} | Language: ${t.language} | Status: ${t.status}`);
      });
    }
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Network Error:', error.message);
  }
}

listTemplates();

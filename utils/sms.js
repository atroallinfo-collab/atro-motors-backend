const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
const sendSMS = async (to, message) => {
  try {
    // Format phone number (add country code if missing)
    let formattedTo = to;
    if (!to.startsWith('+')) {
      formattedTo = `+254${to.replace(/\D/g, '')}`;
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });

    console.log('SMS sent:', result.sid);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Log but don't throw error (SMS failure shouldn't break the app)
    return null;
  }
};

// Send verification code
const sendVerificationCode = async (phone, code) => {
  const message = `Your Atro Motors verification code is: ${code}. Valid for 10 minutes.`;
  return sendSMS(phone, message);
};

// Send test drive reminder
const sendTestDriveReminder = async (phone, details) => {
  const { vehicle, date, time, location } = details;
  const message = `Reminder: Your test drive for ${vehicle} is scheduled for ${date} at ${time} at ${location}.`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendVerificationCode,
  sendTestDriveReminder
};
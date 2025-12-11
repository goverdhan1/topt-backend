# TODO: Fix OTP SMS Sending by Switching to Twilio

## Steps:

- [ ] Edit backend/routes/auth.js:
  - Replace smsmodeService import with twilioService.
  - Update the sendSMS call in /request-otp route to use twilioService.

- [ ] Test locally: Run the server and test /api/auth/request-otp endpoint to confirm SMS is sent via Twilio.

- [ ] Deploy changes to Heroku: Use backend/push.bat or git push heroku main.

- [ ] Verify deployed endpoint: Test the Heroku URL https://topt-backend.onrender.com/api/auth/request-otp with a valid mobile number to ensure no 400 error and SMS delivery.

package com.paywallet.app.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Twilio implementation of {@link SmsService}.
 * <p>
 * In stub mode (account SID = "stub"), the OTP is only logged to the console
 * and no actual SMS is sent. This allows local development without real credentials.
 */
@Service
public class TwilioServiceImpl implements SmsService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromPhoneNumber;

    @Override
    public void sendOtp(String phoneNumber, String otp) {
        // Always log for local development / testing
        System.out.println("[PayWallet OTP] Phone: " + phoneNumber + " | OTP: " + otp);

        if ("stub".equals(accountSid)) {
            System.out.println("[PayWallet OTP] Stub mode — SMS not sent.");
            return;
        }

        Twilio.init(accountSid, authToken);
        Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(fromPhoneNumber),
                "Your PayWallet verification code is: " + otp + ". Valid for 5 minutes."
        ).create();
    }
}


package com.paywallet.app.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;

/**
 * Service for sending transactional emails and OTP verifications via Gmail SMTP.
 * All dispatches run asynchronously to avoid blocking API requests.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:titumaalo@gmail.com}")
    private String fromEmail;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm:ss a");

    /**
     * Sends a 6-digit OTP verification email for login or sensitive operations.
     */
    public void sendLoginOtpEmail(String toEmail, String otp, String userName) {
        String subject = "AkhhaPAY — Login Security OTP: " + otp;
        String greetingName = (userName != null && !userName.isBlank()) ? userName : "Valued Customer";

        String plainText = String.format(
                "Hello %s,\n\nYour 6-digit AkhhaPAY login verification code is: %s\n\n"
                        + "This code is valid for 5 minutes. Do not share this OTP with anyone.\n"
                        + "If you did not attempt this login, please change your password immediately.\n\n"
                        + "Best regards,\nAkhhaPAY Security Team",
                greetingName, otp
        );

        String htmlContent = buildHtmlTemplate(
                "Two-Factor Authentication",
                "Login Verification Code",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 24px;'>Hello <strong style='color: #f8fafc;'>%s</strong>, use the one-time passcode below to authorize your session.</p>", greetingName)
                        + "<div style='background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;'>"
                        + "  <div style='font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 8px;'>One-Time Password</div>"
                        + "  <div style='font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ffffff; font-family: monospace;'>" + otp + "</div>"
                        + "  <div style='font-size: 12px; color: #64748b; margin-top: 8px;'>⏱ Valid for 5 minutes only</div>"
                        + "</div>"
                        + "<p style='color: #ef4444; font-size: 12px; line-height: 1.5; margin-top: 16px;'>⚠️ If you did not initiate this login request, please contact security immediately or change your account credentials.</p>"
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    /**
     * Sends a debit notification email when money is transferred out of a wallet.
     */
    public void sendDebitAlert(String toEmail, String senderName, BigDecimal amount, String referenceNumber,
                               BigDecimal remainingBalance, String receiverInfo) {
        String subject = String.format("AkhhaPAY Alert: ₹%s Debited [%s]", formatAmount(amount), referenceNumber);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        String plainText = String.format(
                "Dear %s,\n\nAn amount of ₹%s has been DEBITED from your AkhhaPAY wallet.\n"
                        + "Reference Number: %s\n"
                        + "Transferred To: %s\n"
                        + "Available Balance: ₹%s\n"
                        + "Timestamp: %s\n\n"
                        + "If you did not authorize this transaction, freeze your account immediately.\n\n"
                        + "AkhhaPAY Customer Service",
                senderName, formatAmount(amount), referenceNumber, receiverInfo, formatAmount(remainingBalance), timestamp
        );

        String htmlContent = buildHtmlTemplate(
                "Transaction Alert",
                "Funds Debited Successfully",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 20px;'>Dear <strong style='color: #f8fafc;'>%s</strong>, a debit transaction was processed on your wallet.</p>", senderName)
                        + buildTransactionTable("DEBIT", "#f43f5e", amount, referenceNumber, receiverInfo, remainingBalance, timestamp)
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    /**
     * Sends a credit notification email when money is received into a wallet.
     */
    public void sendCreditAlert(String toEmail, String receiverName, BigDecimal amount, String referenceNumber,
                                BigDecimal updatedBalance, String senderInfo) {
        String subject = String.format("AkhhaPAY Alert: ₹%s Credited [%s]", formatAmount(amount), referenceNumber);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        String plainText = String.format(
                "Dear %s,\n\nAn amount of ₹%s has been CREDITED to your AkhhaPAY wallet.\n"
                        + "Reference Number: %s\n"
                        + "Received From: %s\n"
                        + "Available Balance: ₹%s\n"
                        + "Timestamp: %s\n\n"
                        + "Thank you for banking with AkhhaPAY.\n\n"
                        + "AkhhaPAY Customer Service",
                receiverName, formatAmount(amount), referenceNumber, senderInfo, formatAmount(updatedBalance), timestamp
        );

        String htmlContent = buildHtmlTemplate(
                "Transaction Alert",
                "Funds Credited Successfully",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 20px;'>Dear <strong style='color: #f8fafc;'>%s</strong>, your wallet has received a new credit transaction.</p>", receiverName)
                        + buildTransactionTable("CREDIT", "#10b981", amount, referenceNumber, senderInfo, updatedBalance, timestamp)
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    /**
     * Sends a confirmation email when money is deposited via online gateway.
     */
    public void sendDepositAlert(String toEmail, String userName, BigDecimal amount, String referenceNumber,
                                 BigDecimal updatedBalance) {
        String subject = String.format("AkhhaPAY Alert: ₹%s Added to Wallet [%s]", formatAmount(amount), referenceNumber);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        String plainText = String.format(
                "Dear %s,\n\nYour wallet deposit of ₹%s was successful.\n"
                        + "Reference Number: %s\n"
                        + "New Balance: ₹%s\n"
                        + "Timestamp: %s\n\n"
                        + "AkhhaPAY Customer Service",
                userName, formatAmount(amount), referenceNumber, formatAmount(updatedBalance), timestamp
        );

        String htmlContent = buildHtmlTemplate(
                "Deposit Confirmation",
                "Funds Added Successfully",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 20px;'>Dear <strong style='color: #f8fafc;'>%s</strong>, your wallet deposit has been verified and credited.</p>", userName)
                        + buildTransactionTable("DEPOSIT", "#10b981", amount, referenceNumber, "Online Gateway (Razorpay)", updatedBalance, timestamp)
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    /**
     * Sends a recharge confirmation email alert.
     */
    public void sendRechargeAlert(String toEmail, String userName, String mobileNumber, String operator,
                                  BigDecimal amount, String referenceNumber, BigDecimal remainingBalance) {
        String subject = String.format("AkhhaPAY Alert: Mobile Recharge ₹%s Successful [%s]", formatAmount(amount), referenceNumber);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        String plainText = String.format(
                "Dear %s,\n\nYour mobile recharge of ₹%s for %s (%s) was successful.\n"
                        + "Reference Number: %s\n"
                        + "Remaining Balance: ₹%s\n"
                        + "Timestamp: %s\n\n"
                        + "Thank you for using AkhhaPAY Services.",
                userName, formatAmount(amount), mobileNumber, operator, referenceNumber, formatAmount(remainingBalance), timestamp
        );

        String htmlContent = buildHtmlTemplate(
                "Recharge Successful",
                "Mobile Recharge Processed",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 20px;'>Dear <strong style='color: #f8fafc;'>%s</strong>, your prepaid recharge has been delivered.</p>", userName)
                        + buildTransactionTable("RECHARGE", "#10b981", amount, referenceNumber, operator + " (" + mobileNumber + ")", remainingBalance, timestamp)
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    /**
     * Sends a utility bill payment receipt email alert.
     */
    public void sendBillPaymentAlert(String toEmail, String userName, String category, String billerName,
                                     String consumerNumber, BigDecimal amount, String referenceNumber, BigDecimal remainingBalance) {
        String subject = String.format("AkhhaPAY Alert: %s Bill Payment ₹%s Confirmed [%s]", category, formatAmount(amount), referenceNumber);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        String plainText = String.format(
                "Dear %s,\n\nYour %s bill payment of ₹%s to %s (Consumer: %s) has been successfully paid.\n"
                        + "Reference Number: %s\n"
                        + "Remaining Balance: ₹%s\n"
                        + "Timestamp: %s\n\n"
                        + "AkhhaPAY Utility Bill Services",
                userName, category, formatAmount(amount), billerName, consumerNumber, referenceNumber, formatAmount(remainingBalance), timestamp
        );

        String htmlContent = buildHtmlTemplate(
                "Bill Payment",
                category + " Bill Paid Successfully",
                String.format("<p style='color: #94a3b8; font-size: 14px; margin-bottom: 20px;'>Dear <strong style='color: #f8fafc;'>%s</strong>, your utility bill payment receipt is confirmed.</p>", userName)
                        + buildTransactionTable(category, "#10b981", amount, referenceNumber, billerName + " (" + consumerNumber + ")", remainingBalance, timestamp)
        );

        dispatchEmail(toEmail, subject, plainText, htmlContent);
    }

    // ── Helper Dispatcher ──────────────────────────────────────────────────

    private void dispatchEmail(String toEmail, String subject, String plainText, String htmlContent) {
        CompletableFuture.runAsync(() -> {
            try {
                String effectiveRecipient = toEmail;
                // If destination is demo admin domain @paywallet.com, route to real admin Gmail so the user receives it in their actual inbox!
                if (toEmail != null && toEmail.toLowerCase().endsWith("@paywallet.com")) {
                    effectiveRecipient = fromEmail;
                    log.info("📧 [EMAIL ENGINE] Routing demo address {} to configured admin Gmail: {}", toEmail, effectiveRecipient);
                }

                log.info("📧 [EMAIL ENGINE] Sending email to: {} | Subject: {}", effectiveRecipient, subject);
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail, "AkhhaPAY Executive Banking");
                helper.setTo(effectiveRecipient);
                helper.setSubject(subject);
                helper.setText(plainText, htmlContent);

                mailSender.send(message);
                log.info("✅ [EMAIL ENGINE] Successfully dispatched email to: {}", effectiveRecipient);
            } catch (Exception e) {
                log.error("⚠️ [EMAIL ENGINE] Delivery via SMTP failed for {}: {}", toEmail, e.getMessage());
                System.out.println("=================================================================");
                System.out.println("[EMAIL FALLBACK CONSOLE] To: " + toEmail);
                System.out.println("[EMAIL FALLBACK CONSOLE] Subject: " + subject);
                System.out.println("[EMAIL FALLBACK CONSOLE] Body: " + plainText);
                System.out.println("=================================================================");
            }
        });
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.forLanguageTag("en-IN"));
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(amount);
    }

    private String buildTransactionTable(String type, String badgeColor, BigDecimal amount, String ref,
                                          String counterparty, BigDecimal balance, String timestamp) {
        return "<div style='background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;'>"
                + "  <div style='display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Transaction Type:</span>"
                + "    <span style='font-size: 12px; font-weight: bold; color: " + badgeColor + ";'>" + type + "</span>"
                + "  </div>"
                + "  <div style='display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Amount:</span>"
                + "    <span style='font-size: 16px; font-weight: bold; color: #ffffff;'>₹" + formatAmount(amount) + "</span>"
                + "  </div>"
                + "  <div style='display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Counterparty / Source:</span>"
                + "    <span style='font-size: 12px; color: #f8fafc;'>" + counterparty + "</span>"
                + "  </div>"
                + "  <div style='display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Reference ID:</span>"
                + "    <span style='font-size: 12px; color: #38bdf8; font-family: monospace;'>" + ref + "</span>"
                + "  </div>"
                + "  <div style='display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 12px;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Available Balance:</span>"
                + "    <span style='font-size: 14px; font-weight: bold; color: #10b981;'>₹" + formatAmount(balance) + "</span>"
                + "  </div>"
                + "  <div style='display: flex; justify-content: space-between;'>"
                + "    <span style='color: #64748b; font-size: 12px;'>Date & Time:</span>"
                + "    <span style='font-size: 12px; color: #94a3b8;'>" + timestamp + "</span>"
                + "  </div>"
                + "</div>"
                + "<p style='color: #64748b; font-size: 11px; line-height: 1.5;'>Note: AkhhaPAY will never ask for your password, transaction PIN, or card CVV via email or phone.</p>";
    }

    private String buildHtmlTemplate(String category, String title, String bodyContent) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='utf-8'></head>"
                + "<body style='background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #f8fafc;'>"
                + "  <div style='max-width: 520px; margin: 0 auto; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);'>"
                + "    <!-- Top Header -->"
                + "    <div style='background: linear-gradient(135deg, #1e3a8a, #0f172a); padding: 28px 24px; border-bottom: 1px solid #1e293b; text-align: center;'>"
                + "      <div style='display: inline-block; background: #3b82f6; width: 40px; height: 40px; border-radius: 10px; line-height: 40px; font-size: 20px; margin-bottom: 10px; color: white;'>💳</div>"
                + "      <h2 style='margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;'>AkhhaPAY</h2>"
                + "      <div style='font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #93c5fd; font-weight: 700; margin-top: 4px;'>" + category + "</div>"
                + "    </div>"
                + "    <!-- Body Card -->"
                + "    <div style='padding: 28px 24px;'>"
                + "      <h3 style='margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #ffffff;'>" + title + "</h3>"
                +        bodyContent
                + "    </div>"
                + "    <!-- Footer -->"
                + "    <div style='background-color: #020617; padding: 16px 24px; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569;'>"
                + "      © 2026 AkhhaPAY Executive Digital Banking. Protected by 256-bit SSL encryption.<br>This is an automated system notification."
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }
}

package com.paywallet.app.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller serving executive Thymeleaf HTML views.
 */
@Controller
public class WebViewController {

    @Value("${razorpay.key.id:rzp_test_TGEgZXObLrLXH4}")
    private String razorpayKeyId;

    @GetMapping("/")
    public String index() {
        return "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("activePage", "dashboard");
        return "dashboard";
    }

    @GetMapping("/transfer")
    public String transfer(Model model) {
        model.addAttribute("activePage", "transfer");
        model.addAttribute("razorpayKeyId", razorpayKeyId);
        return "transfer";
    }

    @GetMapping("/add-funds")
    public String addFunds(Model model) {
        model.addAttribute("activePage", "add-funds");
        model.addAttribute("razorpayKeyId", razorpayKeyId);
        return "add-funds";
    }

    @GetMapping("/recharge")
    public String recharge(Model model) {
        model.addAttribute("activePage", "recharge");
        return "recharge";
    }

    @GetMapping("/bills")
    public String bills(Model model) {
        model.addAttribute("activePage", "bills");
        return "bills";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        model.addAttribute("activePage", "profile");
        return "profile";
    }
}

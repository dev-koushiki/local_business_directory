document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // LOGIN PASSWORD - SHOW / HIDE
    // ==========================================

    const toggleLoginPassword =
        document.getElementById("toggleLoginPassword");

    const loginPasswordInput =
        document.getElementById("modalLoginPassword");

    if (toggleLoginPassword && loginPasswordInput) {

        toggleLoginPassword.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (loginPasswordInput.type === "password") {

                loginPasswordInput.type = "text";

                toggleLoginPassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                toggleLoginPassword.setAttribute(
                    "title",
                    "Hide password"
                );

            } else {

                loginPasswordInput.type = "password";

                toggleLoginPassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

                toggleLoginPassword.setAttribute(
                    "title",
                    "Show password"
                );
            }
        });
    }


    // ==========================================
    // FORGOT PASSWORD ELEMENTS
    // ==========================================

    const forgotPasswordModal =
        document.getElementById("forgotPasswordModal");

    const forgotPasswordButton =
        document.getElementById("forgotPasswordButton");

    const forgotPasswordClose =
        document.getElementById("forgotPasswordClose");

    const backToLoginFromForgot =
        document.getElementById("backToLoginFromForgot");

    const forgotStepEmail =
        document.getElementById("forgotStepEmail");

    const forgotStepOtp =
        document.getElementById("forgotStepOtp");

    const forgotStepReset =
        document.getElementById("forgotStepReset");

    const forgotEmailForm =
        document.getElementById("forgotEmailForm");

    const verifyOtpForm =
        document.getElementById("verifyOtpForm");

    const resetPasswordForm =
        document.getElementById("resetPasswordForm");

    const resendOtpButton =
        document.getElementById("resendOtpButton");

    const forgotEmail =
        document.getElementById("forgotEmail");

    const forgotOtp =
        document.getElementById("forgotOtp");

    const newPassword =
        document.getElementById("newPassword");

    const confirmNewPassword =
        document.getElementById("confirmNewPassword");


    // ==========================================
    // TOAST
    // ==========================================

    const authToast =
        document.getElementById("authToast");

    const authToastIcon =
        authToast
            ? authToast.querySelector(".auth-toast-icon")
            : null;

    const authToastText =
        authToast
            ? authToast.querySelector(".auth-toast-text")
            : null;


    function showToast(message, type = "success") {

        if (!authToast) {
            alert(message);
            return;
        }

        if (authToastText) {
            authToastText.textContent = message;
        }

        if (authToastIcon) {
            authToastIcon.textContent =
                type === "success" ? "✓" : "!";
        }

        authToast.classList.remove("success", "error", "show");

        authToast.classList.add(type);

        // Force animation restart
        void authToast.offsetWidth;

        authToast.classList.add("show");

        setTimeout(function () {
            authToast.classList.remove("show");
        }, 4000);
    }


    function showSuccess(message) {
        showToast(message, "success");
    }


    function showError(message) {
        showToast(message, "error");
    }


    // ==========================================
    // FORGOT PASSWORD STEP CONTROL
    // ==========================================

    function showForgotStep(step) {

        if (forgotStepEmail) {
            forgotStepEmail.style.display = "none";
        }

        if (forgotStepOtp) {
            forgotStepOtp.style.display = "none";
        }

        if (forgotStepReset) {
            forgotStepReset.style.display = "none";
        }

        if (step === "email" && forgotStepEmail) {
            forgotStepEmail.style.display = "block";
        }

        if (step === "otp" && forgotStepOtp) {
            forgotStepOtp.style.display = "block";
        }

        if (step === "reset" && forgotStepReset) {
            forgotStepReset.style.display = "block";
        }
    }


    // ==========================================
    // OPEN FORGOT PASSWORD
    // ==========================================

    if (forgotPasswordButton && forgotPasswordModal) {

        forgotPasswordButton.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            forgotPasswordModal.classList.add("active");

            forgotPasswordModal.setAttribute(
                "aria-hidden",
                "false"
            );

            showForgotStep("email");

            if (forgotEmail) {
                forgotEmail.value = "";
                setTimeout(function () {
                    forgotEmail.focus();
                }, 100);
            }

            if (forgotOtp) {
                forgotOtp.value = "";
            }

            if (newPassword) {
                newPassword.value = "";
            }

            if (confirmNewPassword) {
                confirmNewPassword.value = "";
            }
        });
    }


    // ==========================================
    // CLOSE FORGOT PASSWORD
    // ==========================================

    function closeForgotPassword() {

        if (!forgotPasswordModal) {
            return;
        }

        forgotPasswordModal.classList.remove("active");

        forgotPasswordModal.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    if (forgotPasswordClose) {
        forgotPasswordClose.addEventListener(
            "click",
            closeForgotPassword
        );
    }


    // ==========================================
    // BACK TO LOGIN
    // ==========================================

    if (backToLoginFromForgot) {

        backToLoginFromForgot.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeForgotPassword();

                const authModal =
                    document.getElementById("authModal");

                if (authModal) {

                    authModal.classList.add("active");

                    authModal.setAttribute(
                        "aria-hidden",
                        "false"
                    );
                }
            }
        );
    }


    // ==========================================
    // CLOSE WHEN CLICKING OUTSIDE
    // ==========================================

    if (forgotPasswordModal) {

        forgotPasswordModal.addEventListener(
            "click",
            function (event) {

                if (event.target === forgotPasswordModal) {
                    closeForgotPassword();
                }
            }
        );
    }


    // ==========================================
    // ESC KEY
    // ==========================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                forgotPasswordModal &&
                forgotPasswordModal.classList.contains("active")
            ) {
                closeForgotPassword();
            }
        }
    );


    // ==========================================
    // SEND OTP
    // ==========================================

    if (forgotEmailForm) {

        forgotEmailForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    forgotEmail
                        ? forgotEmail.value.trim()
                        : "";

                if (!email) {
                    showError("Please enter your email address.");
                    return;
                }

                const button =
                    document.getElementById("sendOtpButton");

                if (button) {
                    button.disabled = true;
                    button.textContent = "Sending...";
                }

                try {

                    const response = await fetch(
                        "/forgot-password/request",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to send verification code."
                        );
                    }

                    showSuccess(
                        "Verification code sent to your email."
                    );

                    showForgotStep("otp");

                    if (forgotOtp) {
                        setTimeout(function () {
                            forgotOtp.focus();
                        }, 100);
                    }

                } catch (error) {

                    console.error(
                        "Send OTP error:",
                        error
                    );

                    showError(
                        error.message ||
                        "Unable to send verification code."
                    );

                } finally {

                    if (button) {
                        button.disabled = false;
                        button.textContent =
                            "Send Verification Code";
                    }
                }
            }
        );
    }


    // ==========================================
    // VERIFY OTP
    // ==========================================

    if (verifyOtpForm) {

        verifyOtpForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    forgotEmail
                        ? forgotEmail.value.trim()
                        : "";

                const otp =
                    forgotOtp
                        ? forgotOtp.value.trim()
                        : "";

                if (!otp) {
                    showError(
                        "Please enter the verification code."
                    );
                    return;
                }

                const button =
                    document.getElementById("verifyOtpButton");

                if (button) {
                    button.disabled = true;
                    button.textContent = "Verifying...";
                }

                try {

                    const response = await fetch(
                        "/forgot-password/verify",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                otp: otp
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Invalid verification code."
                        );
                    }

                    showSuccess(
                        "Code verified successfully."
                    );

                    showForgotStep("reset");

                    if (newPassword) {
                        setTimeout(function () {
                            newPassword.focus();
                        }, 100);
                    }

                } catch (error) {

                    console.error(
                        "OTP verification error:",
                        error
                    );

                    showError(
                        error.message ||
                        "Invalid verification code."
                    );

                } finally {

                    if (button) {
                        button.disabled = false;
                        button.textContent = "Verify Code";
                    }
                }
            }
        );
    }


    // ==========================================
    // RESEND OTP
    // ==========================================

    if (resendOtpButton) {

        resendOtpButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();

                const email =
                    forgotEmail
                        ? forgotEmail.value.trim()
                        : "";

                if (!email) {
                    showError("Email address is missing.");
                    return;
                }

                resendOtpButton.disabled = true;
                resendOtpButton.textContent = "Sending...";

                try {

                    const response = await fetch(
                        "/forgot-password/request",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to resend verification code."
                        );
                    }

                    showSuccess(
                        "A new verification code has been sent."
                    );

                    if (forgotOtp) {
                        forgotOtp.value = "";
                        forgotOtp.focus();
                    }

                } catch (error) {

                    console.error(
                        "Resend OTP error:",
                        error
                    );

                    showError(
                        error.message ||
                        "Unable to resend verification code."
                    );

                } finally {

                    resendOtpButton.disabled = false;
                    resendOtpButton.textContent =
                        "Resend Code";
                }
            }
        );
    }


    // ==========================================
    // RESET PASSWORD
    // ==========================================

    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const email =
                    forgotEmail
                        ? forgotEmail.value.trim()
                        : "";

                const password =
                    newPassword
                        ? newPassword.value
                        : "";

                const confirmPassword =
                    confirmNewPassword
                        ? confirmNewPassword.value
                        : "";

                if (!password) {
                    showError(
                        "Please enter a new password."
                    );
                    return;
                }

                if (password !== confirmPassword) {
                    showError(
                        "Passwords do not match."
                    );
                    return;
                }

                const button =
                    document.getElementById(
                        "resetPasswordButton"
                    );

                if (button) {
                    button.disabled = true;
                    button.textContent = "Resetting...";
                }

                try {

                    const response = await fetch(
                        "/forgot-password/reset",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                newPassword: password,
                                confirmPassword:
                                    confirmPassword
                            })
                        }
                    );

                    const data =
                        await response.json();

                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Unable to reset password."
                        );
                    }

                    showSuccess(
                        "Password reset successfully. Please log in."
                    );

                    setTimeout(function () {

                        closeForgotPassword();

                        const authModal =
                            document.getElementById(
                                "authModal"
                            );

                        if (authModal) {

                            authModal.classList.add(
                                "active"
                            );

                            authModal.setAttribute(
                                "aria-hidden",
                                "false"
                            );
                        }

                        if (loginPasswordInput) {
                            loginPasswordInput.value = "";
                            loginPasswordInput.type =
                                "password";
                        }

                    }, 1200);

                } catch (error) {

                    console.error(
                        "Reset password error:",
                        error
                    );

                    showError(
                        error.message ||
                        "Unable to reset password."
                    );

                } finally {

                    if (button) {
                        button.disabled = false;
                        button.textContent =
                            "Reset Password";
                    }
                }
            }
        );
    }

});
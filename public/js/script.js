document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const authModal = document.getElementById("authModal");
    const authModalClose = document.getElementById("authModalClose");

    const loginContainer =
        document.getElementById("loginModalForm");

    const registerContainer =
        document.getElementById("registerModalForm");

    const loginForm =
        document.getElementById("modalLoginForm");

    const registerForm =
        document.getElementById("modalRegisterForm");

    const showRegisterButton =
        document.getElementById("showRegisterButton");

    const showLoginButton =
        document.getElementById("showLoginButton");

    const loginButton =
        document.getElementById("modalLoginButton");

    const registerButton =
        document.getElementById("modalRegisterButton");


    /* =====================================================
       FORGOT PASSWORD ELEMENTS
    ===================================================== */

    const forgotModal =
        document.getElementById("forgotPasswordModal");

    const forgotClose =
        document.getElementById("forgotPasswordClose");

    const forgotButton =
        document.getElementById("forgotPasswordButton");

    const backToLoginButton =
        document.getElementById("backToLoginFromForgot");


    /* =====================================================
       FORGOT PASSWORD STEPS
    ===================================================== */

    const forgotStepEmail =
        document.getElementById("forgotStepEmail");

    const forgotStepOtp =
        document.getElementById("forgotStepOtp");

    const forgotStepReset =
        document.getElementById("forgotStepReset");


    /* =====================================================
       FORMS
    ===================================================== */

    const forgotEmailForm =
        document.getElementById("forgotEmailForm");

    const verifyOtpForm =
        document.getElementById("verifyOtpForm");

    const resetPasswordForm =
        document.getElementById("resetPasswordForm");


    /* =====================================================
       INPUTS
    ===================================================== */

    const forgotEmailInput =
        document.getElementById("forgotEmail");

    const forgotOtpInput =
        document.getElementById("forgotOtp");

    const newPasswordInput =
        document.getElementById("newPassword");

    const confirmNewPasswordInput =
        document.getElementById("confirmNewPassword");


    /* =====================================================
       BUTTONS
    ===================================================== */

    const sendOtpButton =
        document.getElementById("sendOtpButton");

    const verifyOtpButton =
        document.getElementById("verifyOtpButton");

    const resetPasswordButton =
        document.getElementById("resetPasswordButton");

    const resendOtpButton =
        document.getElementById("resendOtpButton");


    /* =====================================================
       TOAST
    ===================================================== */

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


    let toastTimer = null;

    let resetEmail = "";


    /* =====================================================
       TOAST FUNCTIONS
    ===================================================== */

    function hideToast() {

        if (authToast) {
            authToast.classList.remove("show");
        }

    }


    function showToast(message, type) {

        if (!authToast) {
            return;
        }


        clearTimeout(toastTimer);


        authToast.className =
            "auth-toast " +
            type +
            " show";


        if (authToastIcon) {

            if (type === "success") {

                authToastIcon.textContent = "✓";

            } else {

                authToastIcon.textContent = "✕";

            }

        }


        if (authToastText) {

            authToastText.textContent =
                message;

        }


        toastTimer =
            setTimeout(
                hideToast,
                type === "success"
                    ? 3500
                    : 4500
            );

    }


    function showSuccess(message) {

        showToast(
            message,
            "success"
        );

    }


    function showError(message) {

        showToast(
            message,
            "error"
        );

    }


    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );

    }


    /* =====================================================
       RESPONSE HELPER
    ===================================================== */

    async function getResponseData(response) {

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            return await response.json();

        }


        const text =
            await response.text();


        return {

            success: false,

            message:
                text ||
                "Something went wrong."

        };

    }


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    function setButtonLoading(
        button,
        loadingText,
        isLoading
    ) {

        if (!button) {
            return;
        }


        if (isLoading) {

            button.dataset.originalText =
                button.textContent;

            button.disabled =
                true;

            button.textContent =
                loadingText;

        } else {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                button.textContent;

        }

    }


    /* =====================================================
       OPEN OVERLAY
    ===================================================== */

    function openOverlay(overlay) {

        if (!overlay) {
            return;
        }


        overlay.classList.add(
            "active"
        );


        overlay.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       CLOSE OVERLAY
    ===================================================== */

    function closeOverlay(overlay) {

        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "active"
        );


        overlay.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        hideToast();

    }


    /* =====================================================
       SHOW LOGIN
    ===================================================== */

    function showLogin() {

        if (loginContainer) {

            loginContainer.classList.remove(
                "auth-hidden"
            );

        }


        if (registerContainer) {

            registerContainer.classList.add(
                "auth-hidden"
            );

        }


        hideToast();


        setTimeout(function () {

            const input =
                document.getElementById(
                    "modalLoginEmail"
                );


            if (input) {

                input.focus();

            }

        }, 100);

    }


    /* =====================================================
       SHOW REGISTER
    ===================================================== */

    function showRegister() {

        if (loginContainer) {

            loginContainer.classList.add(
                "auth-hidden"
            );

        }


        if (registerContainer) {

            registerContainer.classList.remove(
                "auth-hidden"
            );

        }


        hideToast();


        setTimeout(function () {

            const input =
                document.getElementById(
                    "modalRegisterName"
                );


            if (input) {

                input.focus();

            }

        }, 100);

    }


    /* =====================================================
       OPEN LOGIN / REGISTER MODAL
    ===================================================== */

    function openAuthModal(type) {

        closeOverlay(
            forgotModal
        );


        openOverlay(
            authModal
        );


        if (type === "register") {

            showRegister();

        } else {

            showLogin();

        }

    }


    /* =====================================================
       CLOSE LOGIN MODAL
    ===================================================== */

    function closeAuthModal() {

        closeOverlay(
            authModal
        );

    }


    /* =====================================================
       LOGIN / REGISTER LINKS
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest(
                    'a[href="/login"], a[href="/register"]'
                );


            if (
                !link ||
                event.defaultPrevented
            ) {

                return;

            }


            event.preventDefault();


            const href =
                link.getAttribute(
                    "href"
                );


            if (href === "/register") {

                openAuthModal(
                    "register"
                );

            } else {

                openAuthModal(
                    "login"
                );

            }

        }
    );


    /* =====================================================
       LOGIN CLOSE BUTTON
    ===================================================== */

    if (authModalClose) {

        authModalClose.addEventListener(
            "click",
            closeAuthModal
        );

    }


    /* =====================================================
       CLICK OUTSIDE LOGIN MODAL
    ===================================================== */

    if (authModal) {

        authModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    authModal
                ) {

                    closeAuthModal();

                }

            }
        );

    }


    /* =====================================================
       REGISTER BUTTON
    ===================================================== */

    if (showRegisterButton) {

        showRegisterButton.addEventListener(
            "click",
            function () {

                showRegister();

            }
        );

    }


    /* =====================================================
       LOGIN BUTTON FROM REGISTER
    ===================================================== */

    if (showLoginButton) {

        showLoginButton.addEventListener(
            "click",
            function () {

                showLogin();

            }
        );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                hideToast();


                const emailInput =
                    document.getElementById(
                        "modalLoginEmail"
                    );


                const passwordInput =
                    document.getElementById(
                        "modalLoginPassword"
                    );


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                if (
                    !email ||
                    !password
                ) {

                    showError(
                        "Please enter your email and password."
                    );

                    return;

                }


                if (
                    !isValidEmail(
                        email
                    )
                ) {

                    showError(
                        "Please enter a valid email address."
                    );

                    return;

                }


                setButtonLoading(
                    loginButton,
                    "Logging in...",
                    true
                );


                try {

                    const response =
                        await fetch(
                            "/login",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    "X-Requested-With":
                                        "XMLHttpRequest"

                                },

                                body:
                                    JSON.stringify({

                                        email:
                                            email,

                                        password:
                                            password

                                    })

                            }
                        );


                    const data =
                        await getResponseData(
                            response
                        );


                    if (
                        response.ok &&
                        data.success !== false
                    ) {

                        showSuccess(
                            data.message ||
                            "Login successful!"
                        );


                        setTimeout(
                            function () {

                                window.location.href =
                                    data.redirect ||
                                    "/customer";

                            },
                            900
                        );


                    } else {

                        showError(
                            data.message ||
                            "Invalid email or password."
                        );

                    }


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    showError(
                        "Unable to connect to the server. Please try again."
                    );


                } finally {

                    setButtonLoading(
                        loginButton,
                        "Login",
                        false
                    );

                }

            }
        );

    }


    /* =====================================================
       REGISTER
    ===================================================== */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                hideToast();


                const nameInput =
                    document.getElementById(
                        "modalRegisterName"
                    );


                const emailInput =
                    document.getElementById(
                        "modalRegisterEmail"
                    );


                const passwordInput =
                    document.getElementById(
                        "modalRegisterPassword"
                    );


                const roleInput =
                    document.getElementById(
                        "modalRegisterRole"
                    );


                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : "";


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                const role =
                    roleInput
                        ? roleInput.value
                        : "customer";


                if (
                    !name ||
                    !email ||
                    !password
                ) {

                    showError(
                        "Please fill in all required fields."
                    );

                    return;

                }


                if (
                    !isValidEmail(
                        email
                    )
                ) {

                    showError(
                        "Please enter a valid email address."
                    );

                    return;

                }


                if (
                    password.length < 6
                ) {

                    showError(
                        "Password must be at least 6 characters."
                    );

                    return;

                }


                setButtonLoading(
                    registerButton,
                    "Creating account...",
                    true
                );


                try {

                    const response =
                        await fetch(
                            "/register",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    "X-Requested-With":
                                        "XMLHttpRequest"

                                },

                                body:
                                    JSON.stringify({

                                        name:
                                            name,

                                        email:
                                            email,

                                        password:
                                            password,

                                        role:
                                            role

                                    })

                            }
                        );


                    const data =
                        await getResponseData(
                            response
                        );


                    if (
                        response.ok &&
                        data.success !== false
                    ) {

                        showSuccess(
                            data.message ||
                            "Account created successfully!"
                        );


                        registerForm.reset();


                        setTimeout(
                            function () {

                                showLogin();


                                const loginEmail =
                                    document.getElementById(
                                        "modalLoginEmail"
                                    );


                                if (
                                    loginEmail
                                ) {

                                    loginEmail.value =
                                        email;

                                }

                            },
                            1100
                        );


                    } else {

                        showError(
                            data.message ||
                            "Registration failed. Please try again."
                        );

                    }


                } catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );


                    showError(
                        "Unable to connect to the server. Please try again."
                    );


                } finally {

                    setButtonLoading(
                        registerButton,
                        "Create Account",
                        false
                    );

                }

            }
        );

    }


    /* =====================================================
       FORGOT PASSWORD
       SHOW STEP
    ===================================================== */

    function showForgotStep(step) {

        [
            forgotStepEmail,
            forgotStepOtp,
            forgotStepReset
        ].forEach(
            function (element) {

                if (element) {

                    element.classList.add(
                        "auth-hidden"
                    );

                }

            }
        );


        if (
            step === "email" &&
            forgotStepEmail
        ) {

            forgotStepEmail.classList.remove(
                "auth-hidden"
            );

        }


        if (
            step === "otp" &&
            forgotStepOtp
        ) {

            forgotStepOtp.classList.remove(
                "auth-hidden"
            );

        }


        if (
            step === "reset" &&
            forgotStepReset
        ) {

            forgotStepReset.classList.remove(
                "auth-hidden"
            );

        }

    }


    /* =====================================================
       OPEN FORGOT PASSWORD
    ===================================================== */

    function openForgotPassword() {

        if (!forgotModal) {

            console.error(
                "Forgot Password modal not found."
            );

            return;

        }


        const loginEmail =
            document.getElementById(
                "modalLoginEmail"
            );


        const currentEmail =
            loginEmail
                ? loginEmail.value.trim()
                : "";


        if (forgotEmailInput) {

            forgotEmailInput.value =
                currentEmail;

        }


        showForgotStep(
            "email"
        );


        openOverlay(
            forgotModal
        );


        setTimeout(
            function () {

                if (forgotEmailInput) {

                    forgotEmailInput.focus();

                }

            },
            100
        );

    }


    /* =====================================================
       CLOSE FORGOT PASSWORD
    ===================================================== */

    function closeForgotPassword() {

        closeOverlay(
            forgotModal
        );


        showForgotStep(
            "email"
        );

    }


    /* =====================================================
       FORGOT PASSWORD BUTTON
    ===================================================== */

    if (forgotButton) {

        forgotButton.addEventListener(
            "click",
            function () {

                openForgotPassword();

            }
        );

    }


    /* =====================================================
       FORGOT PASSWORD CLOSE BUTTON
    ===================================================== */

    if (forgotClose) {

        forgotClose.addEventListener(
            "click",
            function () {

                closeForgotPassword();

            }
        );

    }


    /* =====================================================
       CLICK OUTSIDE FORGOT MODAL
    ===================================================== */

    if (forgotModal) {

        forgotModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    forgotModal
                ) {

                    closeForgotPassword();

                }

            }
        );

    }


    /* =====================================================
       BACK TO LOGIN
    ===================================================== */

    if (backToLoginButton) {

        backToLoginButton.addEventListener(
            "click",
            function () {

                closeForgotPassword();

                openAuthModal(
                    "login"
                );

            }
        );

    }


    /* =====================================================
       SEND OTP
    ===================================================== */

    async function sendOtp() {

        const email =
            forgotEmailInput
                ? forgotEmailInput.value
                    .trim()
                    .toLowerCase()
                : "";


        if (!email) {

            showError(
                "Please enter your email address."
            );

            return false;

        }


        if (
            !isValidEmail(
                email
            )
        ) {

            showError(
                "Please enter a valid email address."
            );

            return false;

        }


        resetEmail =
            email;


        setButtonLoading(
            sendOtpButton,
            "Sending code...",
            true
        );


        try {

            const response =
                await fetch(
                    "/forgot-password/request",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-Requested-With":
                                "XMLHttpRequest"

                        },

                        body:
                            JSON.stringify({

                                email:
                                    email

                            })

                    }
                );


            const data =
                await getResponseData(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                showError(
                    data.message ||
                    "Could not send the verification code."
                );

                return false;

            }


            showSuccess(
                data.message ||
                "Verification code sent to your email."
            );


            showForgotStep(
                "otp"
            );


            setTimeout(
                function () {

                    if (forgotOtpInput) {

                        forgotOtpInput.focus();

                    }

                },
                100
            );


            return true;


        } catch (error) {

            console.error(
                "Send OTP error:",
                error
            );


            showError(
                "Unable to connect to the server. Please try again."
            );


            return false;


        } finally {

            setButtonLoading(
                sendOtpButton,
                "Send Verification Code",
                false
            );

        }

    }


    /* =====================================================
       EMAIL FORM
    ===================================================== */

    if (forgotEmailForm) {

        forgotEmailForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                await sendOtp();

            }
        );

    }


    /* =====================================================
       RESEND OTP
    ===================================================== */

    if (resendOtpButton) {

        resendOtpButton.addEventListener(
            "click",
            async function () {

                if (forgotEmailInput) {

                    forgotEmailInput.value =
                        resetEmail;

                }


                await sendOtp();

            }
        );

    }


    /* =====================================================
       OTP INPUT
    ===================================================== */

    if (forgotOtpInput) {

        forgotOtpInput.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

            }
        );

    }


    /* =====================================================
       VERIFY OTP
    ===================================================== */

    if (verifyOtpForm) {

        verifyOtpForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const code =
                    forgotOtpInput
                        ? forgotOtpInput.value.trim()
                        : "";


                if (
                    !/^\d{6}$/.test(
                        code
                    )
                ) {

                    showError(
                        "Please enter the 6-digit verification code."
                    );

                    return;

                }


                setButtonLoading(
                    verifyOtpButton,
                    "Verifying...",
                    true
                );


                try {

                    const response =
                        await fetch(
                            "/forgot-password/verify",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    "X-Requested-With":
                                        "XMLHttpRequest"

                                },

                                body:
                                    JSON.stringify({

                                        email:
                                            resetEmail,

                                        code:
                                            code

                                    })

                            }
                        );


                    const data =
                        await getResponseData(
                            response
                        );


                    if (
                        !response.ok ||
                        data.success === false
                    ) {

                        showError(
                            data.message ||
                            "Incorrect verification code."
                        );

                        return;

                    }


                    showSuccess(
                        data.message ||
                        "Code verified successfully."
                    );


                    showForgotStep(
                        "reset"
                    );


                    setTimeout(
                        function () {

                            if (
                                newPasswordInput
                            ) {

                                newPasswordInput.focus();

                            }

                        },
                        100
                    );


                } catch (error) {

                    console.error(
                        "Verify OTP error:",
                        error
                    );


                    showError(
                        "Unable to verify the code. Please try again."
                    );


                } finally {

                    setButtonLoading(
                        verifyOtpButton,
                        "Verify Code",
                        false
                    );

                }

            }
        );

    }


    /* =====================================================
       RESET PASSWORD
    ===================================================== */

    if (resetPasswordForm) {

        resetPasswordForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const password =
                    newPasswordInput
                        ? newPasswordInput.value
                        : "";


                const confirmPassword =
                    confirmNewPasswordInput
                        ? confirmNewPasswordInput.value
                        : "";


                if (
                    password.length < 6
                ) {

                    showError(
                        "Password must be at least 6 characters."
                    );

                    return;

                }


                if (
                    password !==
                    confirmPassword
                ) {

                    showError(
                        "Passwords do not match."
                    );

                    return;

                }


                setButtonLoading(
                    resetPasswordButton,
                    "Resetting password...",
                    true
                );


                try {

                    const response =
                        await fetch(
                            "/forgot-password/reset",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    "X-Requested-With":
                                        "XMLHttpRequest"

                                },

                                body:
                                    JSON.stringify({

                                        password:
                                            password,

                                        confirmPassword:
                                            confirmPassword

                                    })

                            }
                        );


                    const data =
                        await getResponseData(
                            response
                        );


                    if (
                        !response.ok ||
                        data.success === false
                    ) {

                        showError(
                            data.message ||
                            "Could not reset the password."
                        );

                        return;

                    }


                    showSuccess(
                        data.message ||
                        "Password reset successfully!"
                    );


                    if (
                        resetPasswordForm
                    ) {

                        resetPasswordForm.reset();

                    }


                    if (
                        forgotOtpInput
                    ) {

                        forgotOtpInput.value =
                            "";

                    }


                    setTimeout(
                        function () {

                            closeForgotPassword();


                            openAuthModal(
                                "login"
                            );


                            const loginEmail =
                                document.getElementById(
                                    "modalLoginEmail"
                                );


                            if (
                                loginEmail
                            ) {

                                loginEmail.value =
                                    resetEmail;

                            }


                            const loginPassword =
                                document.getElementById(
                                    "modalLoginPassword"
                                );


                            if (
                                loginPassword
                            ) {

                                loginPassword.focus();

                            }

                        },
                        1200
                    );


                } catch (error) {

                    console.error(
                        "Reset password error:",
                        error
                    );


                    showError(
                        "Unable to reset the password. Please try again."
                    );


                } finally {

                    setButtonLoading(
                        resetPasswordButton,
                        "Reset Password",
                        false
                    );

                }

            }
        );

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            if (
                forgotModal &&
                forgotModal.classList.contains(
                    "active"
                )
            ) {

                closeForgotPassword();

                return;

            }


            if (
                authModal &&
                authModal.classList.contains(
                    "active"
                )
            ) {

                closeAuthModal();

            }

        }
    );

});
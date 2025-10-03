// Mentee Forgot Password Security
(function () {
  function sanitizeEmail(input) {
    return String(input || '')
      .replace(/[\r\n]/g, '') // no newlines
      .trim();
  }

  function isValidEmail(email) {
    // simple RFC5322-like check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  window.MenteeForgotSecurity = {
    isEmailSafe(raw) {
      const email = sanitizeEmail(raw);
      return isValidEmail(email) && email.length <= 254;
    }
  };
})();

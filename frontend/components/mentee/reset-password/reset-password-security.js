// Mentee Reset Password Security
(function () {
  function isStrong(pwd) {
    // At least 8 chars, one upper, one lower, one number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd || '');
  }
  window.MenteeResetSecurity = {
    isPasswordStrong: isStrong
  };
})();

// Mentor Reset Password Functionality
(function () {
  function $(sel) { return document.querySelector(sel); }
  function showAlert(msg, type) {
    const div = document.createElement('div');
    div.className = `alert ${type}`;
    div.textContent = msg;
    const form = $('#mentorResetPasswordForm');
    form.parentElement.insertBefore(div, form.nextSibling);
    setTimeout(() => div.remove(), 4000);
  }
  function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }
  async function handleSubmit(e) {
    e.preventDefault();
    const token = getToken();
    if (!token) { showAlert('Missing or invalid reset token.', 'error'); return; }

    const pwd = $('#mentorNewPassword').value || '';
    const confirm = $('#mentorConfirmPassword').value || '';
    if (!window.MentorResetSecurity || !window.MentorResetSecurity.isPasswordStrong(pwd)) {
      showAlert('Password does not meet the requirements.', 'error');
      return;
    }
    if (pwd !== confirm) {
      showAlert('Passwords do not match.', 'error');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Resetting...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pwd })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Reset failed');
      showAlert('Password reset successful. Redirecting to login...', 'success');
      setTimeout(() => { window.location.href = '/mentor/login'; }, 1500);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mentorResetPasswordForm');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();

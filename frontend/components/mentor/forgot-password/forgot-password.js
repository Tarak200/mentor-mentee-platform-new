// Mentor Forgot Password Functionality
(function () {
  function $(sel) { return document.querySelector(sel); }
  function showAlert(msg, type) {
    const div = document.createElement('div');
    div.className = `alert ${type}`;
    div.textContent = msg;
    const form = $('#mentorForgotPasswordForm');
    form.parentElement.insertBefore(div, form.nextSibling);
    setTimeout(() => div.remove(), 4000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailInput = $('#mentorForgotEmail');
    const email = (emailInput.value || '').trim();
    if (!window.MentorForgotSecurity || !window.MentorForgotSecurity.isEmailSafe(email)) {
      showAlert('Please enter a valid email address.', 'error');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'mentor' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Request failed');
      showAlert('If the email exists, a reset link has been sent.', 'success');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mentorForgotPasswordForm');
    if (form) form.addEventListener('submit', handleSubmit);
  });
})();

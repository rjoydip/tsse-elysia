<template>
  <DefaultLayout>
    <spacer height="32" />

    <heading class="text-2xl text-slate-800 font-semibold text-center">
      Reset Your Password
    </heading>

    <spacer height="16" />

    <text class="text-slate-600 leading-relaxed">
      <p>Hi {{ username }},</p>
      <p>
        We received a request to reset the password for your account. Click the button below to set
        a new password.
      </p>
    </text>

    <spacer height="24" />

    <row>
      <column class="text-center">
        <button
          href="{{ resetUrl }}"
          class="bg-indigo-500 text-white rounded-lg px-6 py-3 font-semibold"
        >
          Reset Password
        </button>
      </column>
    </row>

    <spacer height="24" />

    <text class="text-slate-600 leading-relaxed">
      <p>
        This link expires in {{ expiresIn }}. If you didn't request a password reset, please ignore
        this email or contact support if you have concerns.
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p class="text-indigo-500 break-all">{{ resetUrl }}</p>
    </text>
  </DefaultLayout>
</template>

<script>
/**
 * Password reset email sent when a user requests a password change.
 * Contains a time-limited reset link.
 *
 * @param {string} username - The user's display name
 * @param {string} resetUrl - One-time password reset link
 * @param {string} expiresIn - Human-readable expiration duration (e.g. "1 hour")
 */
export default {
  props: ["username", "resetUrl", "expiresIn"],
};
</script>
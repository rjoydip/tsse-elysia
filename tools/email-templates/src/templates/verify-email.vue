<template>
  <DefaultLayout>
    <spacer height="32" />

    <heading class="text-2xl text-slate-800 font-semibold text-center">
      Verify Your Email Address
    </heading>

    <spacer height="16" />

    <text class="text-slate-600 leading-relaxed">
      <p>Hi {{ username }},</p>
      <p>
        Thanks for signing up! Please verify your email address by clicking the button below. This
        ensures we can keep your account secure and send you important updates.
      </p>
    </text>

    <spacer height="24" />

    <row>
      <column class="text-center">
        <button
          href="{{ verificationUrl }}"
          class="bg-indigo-500 text-white rounded-lg px-6 py-3 font-semibold"
        >
          Verify Email Address
        </button>
      </column>
    </row>

    <spacer height="24" />

    <text class="text-slate-600 leading-relaxed">
      <p>
        This link expires in {{ expiresIn }}. If you did not create an account, no further action is
        required.
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p class="text-indigo-500 break-all">{{ verificationUrl }}</p>
    </text>
  </DefaultLayout>
</template>

<script>
/**
 * Email verification template sent during sign-up flow.
 * Contains a time-limited verification link.
 *
 * @param {string} username - The user's display name
 * @param {string} verificationUrl - One-time email verification link
 * @param {string} expiresIn - Human-readable expiration duration (e.g. "24 hours")
 */
export default {
  props: ["username", "verificationUrl", "expiresIn"],
};
</script>
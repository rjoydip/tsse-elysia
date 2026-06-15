<template>
  <DefaultLayout year="{{ year }}">
    <spacer height="32" />

    <row>
      <column class="text-center">
        <img src="https://your-app.com/logo.png" width="80" alt="Logo" class="mx-auto" />
      </column>
    </row>

    <spacer height="32" />

    <heading class="text-2xl text-slate-800 font-semibold text-center">
      Welcome to TSSE, {{ username }}!
    </heading>

    <spacer height="16" />

    <text class="text-slate-600 leading-relaxed">
      <p>Hi {{ username }},</p>
      <p>
        We're excited to have you on board! Your account has been successfully created and you're
        all set to explore everything TSSE has to offer.
      </p>
    </text>

    <spacer height="24" />

    <row>
      <column class="text-center">
        <button
          href="{{ dashboardUrl }}"
          class="bg-brand-600 text-white rounded-lg px-6 py-3 font-semibold"
        >
          Go to Dashboard
        </button>
      </column>
    </row>

    <spacer height="24" />

    <text class="text-slate-600 leading-relaxed">
      <p>
        If you have any questions, feel free to reach out to our support team. We're here to help!
      </p>
      <p>Cheers,<br />The TSSE Team</p>
    </text>
  </DefaultLayout>
</template>

<script>
/**
 * Welcome email sent to new users after registration.
 *
 * @param {string} username - The user's display name
 * @param {string} dashboardUrl - Link to the user's dashboard
 * @param {number} year - Copyright year for the footer
 */
export default {
  props: ["username", "dashboardUrl", "year"],
};
</script>
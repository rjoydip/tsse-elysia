<template>
  <DefaultLayout>
    <spacer height="32" />

    <row>
      <column class="text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          class="mx-auto"
        >
          <path
            fill="#6366f1"
            d="M12.89 5.64a.184.184 0 0 1-.166-.238a23 23 0 0 1 1.292-3.065a.264.264 0 0 1 .288-.144a19.95 19.95 0 0 1 7.499 2.415a.36.36 0 0 1 .195.363a20.1 20.1 0 0 1-8.721 16.365a.185.185 0 0 1-.283-.086a24 24 0 0 1-.946-3.181a.29.29 0 0 1 .107-.328a16.5 16.5 0 0 0 6.152-10.875a16.5 16.5 0 0 0-5.422-1.226ZM6.301 9.697A13.6 13.6 0 0 1 10.4 8.545c.149-.023.212.081.194.2a26 26 0 0 0-.337 3.209a.23.23 0 0 1-.216.228a10.3 10.3 0 0 0-2.329.759a16.6 16.6 0 0 0 2.617 3.442a.76.76 0 0 1 .211.44a25 25 0 0 0 1.3 4.883a.17.17 0 0 1-.013.2a.19.19 0 0 1-.225 0a20.1 20.1 0 0 1-9.6-16.935a.38.38 0 0 1 .193-.367a20.16 20.16 0 0 1 10.283-2.541a.177.177 0 0 1 .151.274a22 22 0 0 0-1.224 3.099a.24.24 0 0 1-.247.189a16.6 16.6 0 0 0-5.467 1.236a17 17 0 0 0 .61 2.832v.01Z"
          />
        </svg>
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
          class="bg-indigo-500 text-white rounded-lg px-6 py-3 font-semibold"
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

<script setup lang="ts">
/** Welcome email sent to new users after registration. */
defineProps<{
  /** The user's display name */
  username: string;
  /** Link to the user's dashboard */
  dashboardUrl: string;
}>();
</script>
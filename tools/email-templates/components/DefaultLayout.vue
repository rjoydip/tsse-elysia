<template>
  <Layout>
    <slot />

    <spacer height="32" />

    <hr class="border-slate-200" />

    <spacer height="16" />

    <text class="text-xs text-slate-400 text-center leading-tight">
      <p>&copy; {{ currentYear }} TSSE. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </text>
  </Layout>
</template>

<script>
/**
 * Default email layout with footer and container styling.
 * Wraps Maizzle's built-in Layout component and adds a footer.
 */
export default {
  computed: {
    /**
     * @returns {number} Current year for the copyright footer
     */
    currentYear() {
      return new Date().getFullYear();
    },
  },
};
</script>
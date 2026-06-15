<template>
  <Layout>
    <slot />

    <spacer height="32" />

    <hr class="border-slate-200" />

    <spacer height="16" />

    <text class="text-xs text-slate-400 text-center leading-tight">
      <p>&copy; {{ year }} TSSE. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </text>
  </Layout>
</template>

<script>
/**
 * Default email layout with footer and container styling.
 * Wraps Maizzle's built-in Layout component and adds a footer.
 *
 * @param {number} year - Copyright year for the footer
 */
export default {
  props: ["year"],
};
</script>
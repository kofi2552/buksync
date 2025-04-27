// utils/authHelper.js
export const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;

    const parsed = JSON.parse(raw); // Step 1: parse full storage item
    const state = parsed?.state;

    if (!state || !state.user) return null;

    return {
      token: state.user.apiKey,
      email: state.user.email,
    };
  } catch (error) {
    console.error("Error parsing auth storage:", error);
    return null;
  }
};

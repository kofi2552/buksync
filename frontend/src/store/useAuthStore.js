import { create } from "zustand";
import { persist } from "zustand/middleware";
import bookingApi from "../utils/bookingApi";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      userProfile: null,
      loading: true,

      setUser: (user) => set({ user, userProfile: user }),
      setUserProfile: (profile) => set({ userProfile: profile }),

      // Sign in user
      signIn: async (username, email, role, token) => {
        set({ loading: true });
        try {
          const res = await bookingApi.post("/user/create", {
            username,
            email,
            role,
            token,
          });
          const data = res.data;

          if (data?.user) {
            set({
              user: data.user,
              userProfile: data.user,
              token: data?.user.apiKey,
              loading: false,
            });
            return {
              success: true,
              user: {
                token: data?.user.apiKey,
                email: data.user.email,
                username: data.user.username,
                role: data.user.role,
              },
            };
          } else {
            set({ loading: false });
            return {
              success: false,
              error: "Invalid response from server",
              error,
            };
          }
        } catch (error) {
          console.error("Error signing in:", error.message);
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      // Sign out
      signOut: () => {
        set({
          user: null,
          token: null,
          userProfile: null,
          loading: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      // ✅ After rehydration, update loading and userProfile
      onRehydrateStorage: () => (state) => {
        if (!state.user) {
          state.loading = false;
        } else {
          state.userProfile = state.user;
          state.loading = false;
        }
      },
    }
  )
);

export default useAuthStore;

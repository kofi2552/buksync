import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "../contexts/ToastContext";
import useAuthStore from "../store/useAuthStore";
import api from "../utils/api";
import logo from "../assets/buksync-logo-mark.png";

export default function Login() {
  const { signIn } = useAuthStore(); // Destructure the login action from the store
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/overview";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const { email, password } = data;

      // Call the login function from Zustand store
      const result = await api.post("/auth/login", {
        email,
        password,
      });

      //console.log("Login result:", result);

      if (result?.data.message === "Login successful.") {
        // Store API key in backend
        const { email, username } = result.data.user;
        const token = result.data.token;
        const role = "host";
        await signIn(username, email, role, token);

        //console.log("Login successful:", result.data.user);

        navigate(from, { replace: true });
        addToast("Successfully logged in", "success");
      } else {
        addToast(result.error || "Failed to login", "error");
      }
    } catch (error) {
      addToast(error.message || "An error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-apple p-8"
      >
        <div className="flex flex-col justify-center items-center text-center mb-8">
          <img
            src={logo}
            alt="buksync official logo"
            width="20%"
            className="block mb-2"
          />
          <h1 className="text-2xl font-semibold text-neutral-900">
            Welcome to BookSync
          </h1>
          <p className="text-neutral-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`w-full ${
                errors.email ? "border-error-500 focus:ring-error-500" : ""
              }`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`w-full ${
                errors.password ? "border-error-500 focus:ring-error-500" : ""
              }`}
              {...register("password", { required: "Password is required" })}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full btn btn-primary ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{" "}
            <Link
              to="http://www.tudlin.com/welcome"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

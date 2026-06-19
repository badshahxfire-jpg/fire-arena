import { useState } from "react";

export default function LoginPopup({ onClose, onLogin, onForgotPassword, loginLoading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const success = await onLogin(email, password);
    if (success) {
      onClose(); // Close popup after successful login
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-glass-heavy p-8 rounded-3xl w-[400px] border border-glass-orange shadow-glass-glow animate-scale-in font-gaming relative cyber-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-orange-500 text-glow-orange tracking-wide cyber-neon">
            LOGIN
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white font-sans text-xl duration-200"
          >
            ✕
          </button>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#050508]/80 text-white p-4 border border-white/10 focus:border-orange-500/50 rounded-2xl mb-4 outline-none transition-all duration-300 font-sans text-sm"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#050508]/80 text-white p-4 border border-white/10 focus:border-orange-500/50 rounded-2xl mb-6 outline-none transition-all duration-300 font-sans text-sm"
        />

        <button
          onClick={handleLogin}
          disabled={loginLoading}
          className={`w-full py-3.5 rounded-2xl font-extrabold text-base tracking-wide duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md cyber-btn ${
            loginLoading
              ? "bg-orange-500 opacity-50 cursor-not-allowed text-black"
              : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-black shadow-orange-500/10"
          }`}
        >
          {loginLoading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <button
          onClick={() => onForgotPassword(email)}
          className="text-orange-400 text-sm mt-4 hover:underline block text-center w-full"
        >
          Forgot Password?
        </button>
      </div>
    </div>
  );
}
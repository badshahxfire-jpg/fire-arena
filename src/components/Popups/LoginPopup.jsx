import { useState } from "react";

export default function LoginPopup({ onClose, onLogin, onForgotPassword, loginLoading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#050508]/80 text-white p-4 border border-white/10 focus:border-orange-500/50 rounded-2xl outline-none transition-all duration-300 font-sans text-sm pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>

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
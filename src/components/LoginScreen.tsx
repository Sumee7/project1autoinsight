import { useEffect, useRef, useState } from "react";
import { Lock, Mail } from "lucide-react";

interface LoginScreenProps {
  onSuccess: () => void;
}

/**
 * Fake drag-to-verify CAPTCHA (prototype).
 * User must drag the handle all the way to the right to verify.
 */
function DragCaptcha({
  onVerified,
}: {
  onVerified: (verified: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [dragging, setDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const [x, setX] = useState(0); // handle position in px
  const [maxX, setMaxX] = useState(0);

  const HANDLE_SIZE = 44; // px
  const PADDING = 4; // px

  // Calculate max slide distance based on track width
  useEffect(() => {
    const calc = () => {
      const track = trackRef.current;
      if (!track) return;
      const width = track.getBoundingClientRect().width;
      const max = Math.max(0, width - HANDLE_SIZE - PADDING * 2);
      setMaxX(max);
      // If resized smaller, clamp handle
      setX((prev) => Math.min(prev, max));
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const finish = (nextX: number) => {
    // Consider verified if user reaches near the end
    const successThreshold = Math.max(0, maxX - 6);
    const success = nextX >= successThreshold;

    if (success) {
      setVerified(true);
      setX(maxX);
      onVerified(true);
    } else {
      // Snap back
      setVerified(false);
      setX(0);
      onVerified(false);
    }
    setDragging(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (verified) return;
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || verified) return;
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    // Position pointer relative to track left, centre handle under pointer
    const raw = e.clientX - rect.left - HANDLE_SIZE / 2;
    const clamped = Math.min(Math.max(0, raw), maxX);
    setX(clamped);
  };

  const onPointerUp = () => {
    if (!dragging || verified) return;
    finish(x);
  };

  const progress = maxX > 0 ? Math.round((x / maxX) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-800">
          {verified ? "Verified" : "Drag to verify"}
        </p>
        <p className="text-xs text-gray-500">{verified ? "Done" : `${progress}%`}</p>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 rounded-lg bg-white border border-gray-200 overflow-hidden"
        style={{ touchAction: "none" }}
      >
        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 h-full bg-green-100"
          style={{ width: verified ? "100%" : `${Math.min(100, progress)}%` }}
        />

        {/* Hint text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm text-gray-500">
            {verified ? "You're verified" : "Slide the handle to the end →"}
          </span>
        </div>

        {/* Handle */}
        <div
          className={[
            "absolute top-1 left-1 h-10 w-11 rounded-md border flex items-center justify-center",
            verified
              ? "bg-green-600 border-green-700 text-white"
              : dragging
              ? "bg-blue-600 border-blue-700 text-white"
              : "bg-white border-gray-300 text-gray-700",
            verified ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          ].join(" ")}
          style={{ transform: `translateX(${x}px)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <span className="text-lg font-semibold">{verified ? "✓" : "→"}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Prototype only (no real bot detection).
      </p>

      {verified && (
        <button
          type="button"
          className="mt-3 text-sm text-blue-700 hover:text-blue-800"
          onClick={() => {
            setVerified(false);
            setX(0);
            onVerified(false);
          }}
        >
          Reset verification
        </button>
      )}
    </div>
  );
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  const requireCaptcha = () => {
    if (!isVerified) {
      setError("Please complete the verification slider.");
      return false;
    }
    return true;
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!requireCaptcha()) return;

    // simple validation (prototype)
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    onSuccess();
  };

  const handleGoogleLogin = () => {
    setError("");
    if (!requireCaptcha()) return;

    // Fake Google login success
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AutoInsight</h1>
          <p className="text-lg text-gray-600">Prototype login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Sign in
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Fake Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!isVerified}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!isVerified ? "Complete verification first" : "Continue with Google"}
          >
            <span className="text-xl">G</span>
            Continue with Google
          </button>

          <div className="my-5 text-center text-sm text-gray-500">or</div>

          {/* Email/Password Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ashish@example.com"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Drag CAPTCHA */}
            <DragCaptcha
              onVerified={(v) => {
                setIsVerified(v);
                if (v) setError("");
              }}
            />

            <button
              type="submit"
              disabled={!isVerified}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                if (!requireCaptcha()) return;
                onSuccess();
              }}
              disabled={!isVerified}
              className="w-full bg-white text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue as guest
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

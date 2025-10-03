export default function DivineBackground() {
  return (
     <div className="absolute inset-0 opacity-30 z-0">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill="url(#gradient)"
            fillOpacity="0.4"
            d="M0,128L48,149.3C96,171,192,213,288,208C384,203,480,149,576,133.3C672,117,768,139,864,144C960,149,1056,139,1152,138.7C1248,139,1344,149,1392,154.7L1440,160L1440,320L0,320Z"
          ></path>
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>
  );
}

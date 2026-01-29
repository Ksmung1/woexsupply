import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
          const{ isDark} = useTheme()
          return (
            <footer
              className={`mt-20 border-t ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                  : "bg-zinc-100 border-zinc-200 text-zinc-700"
              }`}
            >
              <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
                
                {/* Brand */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src="/logo.png"
                      alt="WOEX Supply"
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-lg font-semibold text-indigo-500">
                      WOEX SUPPLY
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    Fast, secure game top-ups and digital services.
                    Trusted by thousands of gamers.
                  </p>
                </div>
        
                {/* Explore */}
                <div>
                  <h4 className="mb-4 font-semibold text-sm uppercase tracking-wide text-zinc-500">
                    Explore
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/" className="hover:text-indigo-500">Home</a></li>
                    <li><a href="/browse" className="hover:text-indigo-500">Browse Games</a></li>
                    <li><a href="/leaderboards" className="hover:text-indigo-500">Leaderboards</a></li>
                  </ul>
                </div>
        
                {/* Support */}
                <div>
                  <h4 className="mb-4 font-semibold text-sm uppercase tracking-wide text-zinc-500">
                    Support
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/about" className="hover:text-indigo-500">About</a></li>
                    <li><a href="/contact" className="hover:text-indigo-500">Contact</a></li>
                    <li><a href="/privacy" className="hover:text-indigo-500">Privacy Policy</a></li>
                    <li><a href="/terms" className="hover:text-indigo-500">Terms of Service</a></li>
                  </ul>
                </div>
        
                {/* Community */}
                <div>
                  <h4 className="mb-4 font-semibold text-sm uppercase tracking-wide text-zinc-500">
                    Community
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-indigo-500">Discord</a></li>
                    <li><a href="#" className="hover:text-indigo-500">Telegram</a></li>
                    <li><a href="mailto:support@woex.com" className="hover:text-indigo-500">
                      support@woex.com
                    </a></li>
                  </ul>
                </div>
              </div>
        
              {/* Bottom bar */}
              <div
                className={`text-center text-xs py-4 ${
                  isDark ? "text-zinc-500" : "text-zinc-500"
                }`}
              >
                © {new Date().getFullYear()} WOEX SUPPLY. All rights reserved.
              </div>
            </footer>
          );
        };
        
        export default Footer;
        
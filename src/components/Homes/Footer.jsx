import React from "react";
import { Link } from "react-router-dom";
import { FaTwitter, FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import logo from "../../assets/images/logo.png"
const Footer = () => {
  const { showError, showSuccess } = useAlert();
  return (
    <footer className="w-full border-t border-gray-200 bg-white text-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 w-10 object-contain rounded-md" />
              <div>
                <h4 className="text-lg font-semibold">Woex</h4>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Fast access to the best mobile and web games. Top up, compete on leaderboards, and win rewards.
            </p>

            <div className="flex items-center gap-3 mt-1">
              <a aria-label="Twitter" href="https://twitter.com" className="p-2 rounded-md hover:bg-gray-100 transition">
                <FaTwitter />
              </a>
              <a aria-label="Instagram" href="https://instagram.com" className="p-2 rounded-md hover:bg-gray-100 transition">
                <FaInstagram />
              </a>
              <a aria-label="Facebook" href="https://facebook.com" className="p-2 rounded-md hover:bg-gray-100 transition">
                <FaFacebookF />
              </a>
              <a aria-label="YouTube" href="https://youtube.com" className="p-2 rounded-md hover:bg-gray-100 transition">
                <FaYoutube />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-sm font-semibold mb-3">Quick links</h5>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/" className="hover:underline">Home</Link>
              </li>
              <li>
                <Link to="/leaderboards" className="hover:underline">Leaderboards</Link>
              </li>
              <li>
                <Link to="/browse" className="hover:underline">Browse Games</Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:underline">Wallet</Link>
              </li>
              <li>
                <Link to="/about" className="hover:underline">About</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-sm font-semibold mb-3">Support</h5>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/help" className="hover:underline">Help center</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">Contact</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:underline">Terms &amp; conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:underline">Privacy policy</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h5 className="text-sm font-semibold mb-3">Stay in the loop</h5>
            <p className="text-sm text-gray-600 mb-3">Subscribe for news, giveaways and early access to events.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = form.email?.value?.trim();
                if (!email) {
                  showError("Please enter an email address");
                  return;
                }
                // placeholder: replace with your subscription logic
                showSuccess(`Thanks! You've subscribed with ${email}`);
                form.reset();
              }}
              className="flex gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <input
                id="footer-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Email address"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                aria-label="Subscribe"
              >
                Subscribe
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-3">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* bottom row */}
        <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© 2025 Woex Supply. All rights reserved.</p>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Made with ❤️</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

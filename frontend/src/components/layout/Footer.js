import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <>
      <div className="flex justify-center">
        <footer className="w-8/12 py-3 mt-3 text-sm border-t border-zinc-400 text-zinc-600">
          <div>
            <ul className="flex p-3 justify-between items-center">
              <li>
                <Link
                  className="flex items-center"
                  href={`/`}
                >
                  <img
                    className="h-3.5 w-auto mr-1.5"
                    src="/images/star.png"
                  ></img>
                  <span>leidorf</span>
                </Link>
                <span>copyleft 🄯</span>
              </li>
              <li className="flex">
                <Link
                  className="footer-item"
                  href={`https://github.com/leidorf`}
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Footer;

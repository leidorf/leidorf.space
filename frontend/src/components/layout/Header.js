import Link from "next/link";

const Header = () => {
  return (
    <>
      <div className="flex justify-center">
        <header className="mb-3 border-b border-zinc-400 w-8/12 ">
          <ul className="flex p-3 justify-between items-center">
            <li>
              <Link
                className="flex items-center"
                href={`/`}
              >
                <img
                  className="h-8 w-auto mr-1"
                  src="images/star.png"
                ></img>
                <span className="text-4xl text-decoration-none font-black">leidorf</span>
              </Link>
            </li>
            <li className="flex">
              <Link
                className="header-item"
                href={"/works"}
              >
                works
              </Link>
              <Link
                className="header-item"
                href={"/about"}
              >
                about
              </Link>
              <Link
                className="header-item"
                href={"/contact"}
              >
                contact
              </Link>
            </li>
          </ul>
        </header>
      </div>
    </>
  );
};

export default Header;

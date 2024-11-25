import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

const NotFound = () => {
  return (
    <>
      <Layout>
        <PageHead headTitle={`404 not found`}></PageHead>
        <div className="text-center items-center">
          <div className="relative flex items-center justify-center h-96 my-16">
            <span className="absolute text-[160px] sm:text-[240px] md:text-[320px] lg:text-[400px] font-black -z-50 text-gray-300">404</span>
            <span className="absolute font-black text-red-600 text-lg red-underline sm:text-xl md:text-2xl">not found</span>
          </div>

          <p>
            return to{` `}
            <Link
              href={`/`}
              className="red-underline"
            >
              home page
            </Link>
            .
          </p>
        </div>
      </Layout>
    </>
  );
};

export default NotFound;

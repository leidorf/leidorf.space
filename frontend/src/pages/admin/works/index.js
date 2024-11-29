import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

const works = () => {
  return (
    <>
      <Layout>
        <PageHead headTitle={`works`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p className="text-2xl">workss!!</p>
              <Link
                href={`./works/create_work`}
                className="red-underline"
              >
                create work!!
              </Link>
            </div>
            <Link
              href={`./dashboard`}
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default works;

import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

const profile = () => {
  return (
    <>
      <Layout>
        <PageHead headTitle={`profile`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div>
              <p>profile</p>
              <Link
                href={`./dashboard`}
                className="red-underline"
              >
                go back
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default profile;

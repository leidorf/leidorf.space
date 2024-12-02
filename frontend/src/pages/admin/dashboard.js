import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";

const Dashboard = () => {
  return (
    <Layout>
      <PageHead headTitle={`dashboard`} />
      <div className="flex justify-center">
        <div className="w-8/12">
          <p className="text-3xl mb-4 font-black red-underline">admin dashboard</p>
          <div className="py-2">
            <ul>
              <li>
                <Link
                  href={`/admin/profile`}
                  className="header-item"
                >
                  profile
                </Link>
              </li>
              <li>
                <Link
                  href={`/admin/works`}
                  className="header-item"
                >
                  works
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(Dashboard);

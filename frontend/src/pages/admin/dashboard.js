import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

const checkJWT = async (router) => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:8000/api/admin/dashboard", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401) {
    router.push("/admin/login");
  }
};

const dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    checkJWT(router);
  }, []);

  return (
    <>
      <Layout>
        <PageHead headTitle={`dashboard`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <p className="text-2xl mb-4 font-black red-underline">admin dashboard</p>
            <div className="py-2">
              <ul>
                <li>
                  <Link
                    href={`./profile`}
                    className="header-item"
                  >
                    profile
                  </Link>
                </li>
                <li>
                  <Link
                    href={`./works`}
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
    </>
  );
};

export default dashboard;

import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";
import { useEffect, useState } from "react";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Redirecting to login...");
        window.location.href = "/admin/login";
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/users/1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data. Redirecting to login...");
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error(err.message);
        setError(err.message);
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 3000);
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return (
      <Layout>
        <PageHead headTitle="profile" />
        <div className="flex justify-center">
          <div className="w-8/12 text-center">
            <p className="text-2xl mb-4 font-black red-underline">{error}</p>
            <Link
              href="/admin/dashboard"
              className="red-underline"
            >
              go back to dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <PageHead headTitle="profile" />
        <div className="flex justify-center">
          <div className="w-8/12 text-center">
            <p className="text-2xl mb-4 font-black red-underline">loading user data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHead headTitle="profile" />
      <div className="flex justify-center">
        <div className="w-8/12">
          <div>
            <p className="text-3xl mb-4 font-black red-underline">profile</p>
            <div className="mb-4">
              <table className="text-left">
                <tbody>
                  <tr className="border-b border-zinc-400">
                    <th className="pr-4 py-2 font-bold">username</th>
                    <td className="pr-4 py-2">
                      {user.username} ({user.id})
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-400">
                    <th className="pr-4 py-2 font-bold">email</th>
                    <td className="pr-4 py-2">{user.email}</td>
                  </tr>
                  <tr className="border-b border-zinc-400">
                    <th className="pr-4 py-2 font-bold">created</th>
                    <td className="pr-4 py-2">{new Date(user.created_at).toUTCString()}</td>
                  </tr>
                  <tr>
                    <th className="pr-4 py-2 font-bold">updated</th>
                    <td className="pr-4 py-2">{new Date(user.updated_at).toUTCString()}</td>
                  </tr>
                </tbody>
              </table>
              <div className="my-2">
                <Link
                  href="./update_profile"
                  className="red-underline"
                >
                  update
                </Link>
              </div>
            </div>
            <Link
              href="./dashboard"
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(Profile);

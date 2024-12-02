import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const UpdateProfile = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 3000);
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
        setUsername(data.username || "");
        setEmail(data.email || "");
        setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email) {
      setError("Please fill out all fields!");
      return;
    }
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 3000);
        return;
      }

      const response = await fetch("http://localhost:8000/api/users/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid field values!");
      }

      router.push("/admin/profile");
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageHead headTitle="update profile" />
        <div className="flex justify-center">
          <p className="text-lg">loading user data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHead headTitle="update profile" />
        <div className="flex justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHead headTitle="update profile" />
      <div className="flex justify-center">
        <div className="w-8/12">
          <p className="text-3xl mb-4 font-black red-underline">update profile</p>
          <div className="mb-4">
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="username"
                className="block"
              >
                username
              </label>
              <input
                id="username"
                name="username"
                className="input-section"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
              />
              <label
                htmlFor="email"
                className="block"
              >
                email
              </label>
              <input
                id="email"
                name="email"
                className="input-section"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              {error && <p className="text-red-600 mb-2">{error}</p>}
              <button
                type="submit"
                className="block input-section !border-green-600 my-2 px-2"
              >
                update
              </button>
            </form>
          </div>
          <Link
            className="red-underline"
            href="/admin/profile"
          >
            go back
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(UpdateProfile);

import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";

const login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("./dashboard");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("invalid credentials!");
      }
      const data = await response.json();
      localStorage.setItem("token", data.token);
      setLoading(false);
      router.push("./dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Layout>
        <PageHead headTitle={`log in`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <img
                src="/images/star.png"
                className="h-16 w-auto"
              />
              <p className="text-2xl font-black red-underline">log in</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label
                  htmlFor="username"
                  className="block"
                >
                  username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent border border-red-600 rounded mb-2 focus:outline-none"
                  required
                />
                <label
                  htmlFor="password"
                  className="block"
                >
                  password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border border-red-600 rounded mb-2 focus:outline-none"
                  required
                />
              </div>
              {error && <p className="text-red-600">{error}</p>}
              <div className="mt-2">
                <button
                  type="submit"
                  className="button-submit"
                  disabled={loading}
                >
                  {loading ? "logging in..." : "log in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default login;

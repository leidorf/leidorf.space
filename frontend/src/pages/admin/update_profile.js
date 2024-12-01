import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps() {
  try {
    const response = await fetch("http://goapp:8000/api/users/1");
    if (!response.ok) {
      throw new Error("failed to fetch admin infos");
    }
    const user = await response.json();
    return { props: { user } };
  } catch (error) {
    console.error("error fetching user: ", error);
    return { props: { user: null } };
  }
}

export default function UpdateProfile({ user }) {
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email) {
      setError("please fill out all fields!");
      return;
    }
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/users/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error("invalid field values!");
      }
    } catch (error) {
      setError(error.message);
    }
    router.push("/admin/profile");
  };

  return (
    <>
      <Layout>
        <PageHead headTitle={`update profile`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <p className="text-2xl mb-4 font-black red-underline">update profile</p>
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
              href={`./profile`}
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}

import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

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

export default function profile({ user }) {
  return (
    <>
      <Layout>
        <PageHead headTitle={`profile`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div>
              <p className="text-2xl mb-4 font-black red-underline">profile</p>
              <div className="mb-4">
                <table className="text-left">
                  <tbody>
                    <tr className="border-b border-zinc-400">
                      <th className="pr-4 py-2 font-bold ">username</th>
                      <td className="pr-4 py-2">
                        {user.username} ({user.id})
                      </td>
                    </tr>

                    <tr className="border-b border-zinc-400">
                      <th className="pr-4 py-2 font-bold ">email</th>
                      <td className="pr-4 py-2">{user.email}</td>
                    </tr>

                    <tr className="border-b border-zinc-400">
                      <th className="pr-4 py-2 font-bold ">created</th>
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
                    className="red-underline"
                    href={`./update_profile`}
                  >
                    update
                  </Link>
                </div>
              </div>

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
}

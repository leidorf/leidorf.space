import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const response = await fetch(`http://goapp:8000/api/work/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch work data");
    }
    const work = await response.json();
    return {
      props: { work },
    };
  } catch (error) {
    console.error("Error fetching work:", error);
    return {
      props: { work: null },
    };
  }
}

const deleteWork = async (workId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/admin/login";
    return false;
  }

  try {
    const response = await fetch(`http://localhost:8000/api/works/${workId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response details:", response);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete the work: ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Error while deleting the work:", error);
    return false;
  }
};

const EditWork = ({ work }) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const success = await deleteWork(work.id, token);
    if (success) {
      router.push("/admin/works");
    } else {
      alert("Failed to delete the work");
    }
  };

  const handlePublish = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/work/${work.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to change work visibility");
      }

      router.replace(router.asPath);
    } catch (error) {
      console.error("Error changing work visibility:", error.message);
    }
  };

  if (!work) {
    return (
      <Layout>
        <PageHead headTitle="Work Not Found" />
        <div className="flex justify-center">
          <div className="w-8/12">
            <p>the requested work was not found.</p>
            <Link
              href="/admin/works"
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <PageHead headTitle={work.title} />
        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p>
                work {work.id} ({work.category} / {work.content_type})
              </p>
              <p className="text-3xl mb-4 font-black red-underline">{work.title}</p>

              <div className="border p-2 my-2 inline-block">
                {work.content_type === "text" ? (
                  <p className="w-fit">{work.content}</p>
                ) : (
                  <img
                    className="w-full max-w-xs lg:max-w-md h-auto"
                    src={`/works/${work.image_name}`}
                    alt={work.title}
                  />
                )}
              </div>

              <p className="text-red-600">- {work.author}</p>
              <p>created: {new Date(work.created_at).toUTCString()}</p>
              <p>updated: {new Date(work.updated_at).toUTCString()}</p>
              <button
                type="button"
                className="my-2 input-section px-2 w-36 text-nowrap"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handlePublish}
              >
                {work.is_published ? (isHovered ? "take down?" : "published ✅") : isHovered ? "publish?" : "NOT published ❌"}
              </button>
              <div className="mt-2">
                <Link
                  href={`/admin/works/${work.id}/update`}
                  className="input-section !border-green-600 hover:bg-green-600 px-2 mr-2 w-16"
                >
                  update
                </Link>
                <button
                  className="rounded bg-red-700 hover:bg-red-900 w-16 px-2"
                  type="button"
                  onClick={handleDelete}
                >
                  delete
                </button>
              </div>
            </div>

            <Link
              href="/admin/works"
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

export default withAuth(EditWork);

import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps(context) {
  const { id } = context.params;
  try {
    const response = await fetch(`http://goapp:8000/api/work/${id}`);
    if (!response.ok) {
      throw new Error("failed to fetch data");
    }
    const work = await response.json();
    return {
      props: { work },
    };
  } catch (error) {
    console.error("error fetching work:", error);
    return {
      props: { work: null },
    };
  }
}

export async function deleteWork(work_id) {
  try {
    const response = await fetch(`http://localhost:8000/api/works/${work_id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete the work");
    }
    return true;
  } catch (error) {
    console.error("Error while deleting the work:", error);
    return false;
  }
}

export default function EditWork({ work }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    const success = await deleteWork(work.id);
    if (success) {
      router.push("/admin/works");
    } else {
      alert("failed to delete the work");
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/work/${work.id}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to change work visibility");
      }

      router.replace(router.asPath);
    } catch (error) {
      console.error("Error changing work visibility:", error.message);
      alert("Failed to change work visibility");
    }
  };

  if (!work) {
    return (
      <Layout>
        <PageHead headTitle="work not found" />
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
            <div>
              <div className="mb-4">
                <p>
                  work {work.id} ({work.category} / {work.content_type})
                </p>
                <p className="font-black">{work.title}</p>
                <div className="border w-fit p-2 my-2">
                  {work.content_type === "text" ? <p>{work.content}</p> : <img src={`http://localhost:8000/${work.image_path}`} />}
                </div>
                <p className="text-red-600">- {work.author}</p>
                <p>create: {new Date(work.created_at).toUTCString()}</p>
                <p>update: {new Date(work.updated_at).toUTCString()}</p>
                <button
                  type="button"
                  className="my-2 input-section px-2 w-36 text-nowrap"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={handlePublish}
                >
                  {work.is_published
                    ? isHovered
                      ? "take down?"
                      : "published ✅"
                    : isHovered
                    ? "publish?"
                    : "NOT published ❌"}
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
        </div>
      </Layout>
    </>
  );
}

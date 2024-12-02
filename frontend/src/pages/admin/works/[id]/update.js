import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const response = await fetch(`http://goapp:8000/api/work/${id}`);
    if (!response.ok) {
      throw new Error("Could not fetch the work data");
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

const UpdateWork = ({ work }) => {
  if (!work) {
    return (
      <Layout>
        <PageHead headTitle="Update" />
        <div className="flex justify-center">
          <div className="w-8/12 text-center">
            <p className="text-2xl mb-4 font-black red-underline">work data could not be fetched...</p>
            <Link
              href={`/admin/works`}
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const [title, setTitle] = useState(work?.title || "");
  const [author, setAuthor] = useState(work?.author || "");
  const [contentType] = useState(work?.content_type || "");
  const [category, setCategory] = useState(work?.category || "");
  const [content, setContent] = useState(work?.content || "");
  const [imageFile, setImageFile] = useState(null);
  const [imageName] = useState(work?.image_name || null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !author || !category || (contentType === "text" && !content)) {
      setError("Please fill out all required fields!");
      return;
    }

    if (contentType === "image" && !imageFile && !imageName) {
      setError("Please upload a new image or keep the current one!");
      return;
    }

    if (!["story", "poem", "digital-art", "pixel-art", "glitch-art", "photography"].includes(category)) {
      setError("Content type and category do not match!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found. Redirecting to login...");
      window.location.href = "/admin/login";
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("content_type", contentType);
    formData.append("category", category);

    if (contentType === "text") {
      formData.append("content", content);
    } else if (contentType === "image" && imageFile) {
      formData.append("file", imageFile);
    }

    try {
      const response = await fetch(`http://localhost:8000/api/works/${work.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update the work");
      }

      router.push(`/admin/works/${work.id}`);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Layout>
      <PageHead headTitle={`Update ${work.title}`} />
      <div className="flex justify-center">
        <div className="w-8/12">
          <p className="text-3xl mb-4 font-black red-underline">{`Update ${title}`}</p>
          <form
            className="mb-4"
            onSubmit={handleSubmit}
          >
            <label className="block">title</label>
            <input
              className="input-section"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
            />
            <label className="block">author</label>
            <input
              className="input-section"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              type="text"
            />
            <label className="block">category</label>
            <input
              className="input-section"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              type="text"
            />
            {contentType === "text" && (
              <div>
                <label className="block">content</label>
                <textarea
                  placeholder="Content..."
                  rows={6}
                  className="input-section"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            )}
            {contentType === "image" && (
              <div>
                <div className="border p-2 my-2 inline-block">
                  <p>/old image</p>
                  <img
                    className="w-full max-w-xs lg:max-w-sm h-auto"
                    src={`/works/${imageName}`}
                    alt={title}
                  />
                </div>

                <input
                  type="file"
                  accept="image/*"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="block input-section w-28 text-center"
                >
                  upload image
                </label>
                <p className="mt-2 text-zinc-300">{imageFile ? imageFile.name : "no file selected."}</p>
              </div>
            )}

            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div>
              <button
                type="submit"
                className="button-submit my-2 !border-green-600"
              >
                update
              </button>
            </div>
          </form>
          <Link
            className="red-underline"
            href={`/admin/works/${work.id}`}
          >
            go back
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(UpdateWork);

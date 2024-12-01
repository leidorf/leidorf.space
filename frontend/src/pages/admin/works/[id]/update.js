import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const response = await fetch(`http://goapp:8000/api/work/${id}`);
    if (!response.ok) {
      throw new Error("could not fetch the work datas");
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

export default function UpdateWork({ work }) {
  if (!work) {
    return (
      <>
        <Layout>
          <PageHead headTitle={"update"}></PageHead>
          <div className="flex justify-center">
            <div className="w-8/12 text-center">
              <p className="text-2xl mb-4 font-black red-underline">work datas could not fetch...</p>
              <Link
                className="red-underline"
                href={`/admin/works`}
              >
                go back
              </Link>
            </div>
          </div>
        </Layout>
      </>
    );
  } else {
    const [title, setTitle] = useState(work?.title || "");
    const [author, setAuthor] = useState(work?.author || "");
    const [contentType, setContentType] = useState(work?.content_type || "");
    const [category, setCategory] = useState(work?.category || "");
    const [content, setContent] = useState(work?.content || "");
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleFileChange = (e) => {
      setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!title || !author || !category || (contentType === "text" && !content) || (contentType === "image" && !imageFile)) {
        setError("please fill out all fields!");
        return;
      }

      if (!["story", "category", "digital-art", "pixel-art", "glitch-art", "photography"].includes(category)) {
        setError("content type and category do not match");
        return;
      }

      const payload = {
        title,
        author,
        content_type: contentType,
        category,
        content: contentType === "text" ? content : undefined,
        image_path: contentType === "image" ? imageFile?.name : undefined,
      };

      console.log("submitting payload:", payload);

      try {
        const response = await fetch(`http://localhost:8000/api/works/${work.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("response error:", errorText);
          throw new Error("failed to update the work");
        }

        const updatedWork = await response.json();
        console.log("updated work from server:", updatedWork);

        alert("work updated successfully!");
        router.push(`/admin/works/${work.id}`);
      } catch (error) {
        console.error("error during update:", error.message);
        setError(error.message);
      }
    };

    return (
      <>
        <Layout>
          <PageHead headTitle={work.title}></PageHead>
          <div className="flex justify-center">
            <div className="w-8/12">
              <p className="text-2xl mb-4 font-black red-underline">update</p>
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
                      placeholder="content..."
                      rows={6}
                      className="input-section"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                )}
                {contentType === "image" && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      required
                    />
                    <label
                      htmlFor="file-upload"
                      className="block input-section w-1/12 text-center"
                    >
                      upload image
                    </label>
                    <p className="mt-2 text-zinc-300">{file ? `${file}` : "no file selected."}</p>
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
      </>
    );
  }
}

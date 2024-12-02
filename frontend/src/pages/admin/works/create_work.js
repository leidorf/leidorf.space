import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import withAuth from "@/components/utils/withAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const CreateWork = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSelectChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setError("");

    if (selectedCategory === "poem" || selectedCategory === "story") {
      setContentType("text");
    } else if (["digital-art", "pixel-art", "glitch-art", "photography"].includes(selectedCategory)) {
      setContentType("image");
    } else {
      setContentType("");
      setError("Content type and category do not match.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !author || !category || (contentType === "text" && !content) || (contentType === "image" && !file)) {
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

      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("category", category);
      formData.append("content_type", contentType);

      if (contentType === "text") {
        formData.append("content", content);
      } else if (contentType === "image") {
        formData.append("file", file);
      }

      const response = await fetch("http://localhost:8000/api/works", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid field values or server error!");
      }

      router.push("/admin/works");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Layout>
        <PageHead headTitle={`Create Work`} />
        <div className="flex justify-center">
          <div className="w-8/12">
            <p className="text-3xl mb-4 font-black red-underline">Create Work</p>
            <form className="mb-4" onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-section pl-2"
                  required
                />
                <label className="block">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="input-section pl-2"
                  required
                />
                <label className="block">Category</label>
                <select
                  id="dropdown"
                  value={category}
                  onChange={handleSelectChange}
                  className="input-section px-2"
                  required
                >
                  <option value="" disabled>
                    Category
                  </option>
                  <option value="poem">Poem</option>
                  <option value="story">Story</option>
                  <option value="digital-art">Digital Art</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="glitch-art">Glitch Art</option>
                  <option value="photography">Photography</option>
                </select>
                {contentType === "text" && (
                  <div className="mb-2">
                    <label className="block">Content</label>
                    <textarea
                      placeholder="Content..."
                      rows={6}
                      className="input-section"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                )}
                {contentType === "image" && (
                  <div className="mb-2">
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
                      Upload Image
                    </label>
                    <p className="mt-2 text-zinc-300">
                      {file ? file.name : "No file selected."}
                    </p>
                  </div>
                )}
              </div>
              {error && <p className="text-red-600 mb-2">{error}</p>}
              <div>
                <button
                  type="submit"
                  className="button-submit !border-green-600 my-2"
                >
                  Create
                </button>
              </div>
            </form>
            <Link href="../dashboard" className="red-underline">
              Go back
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default withAuth(CreateWork);
